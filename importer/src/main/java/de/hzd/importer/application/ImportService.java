package de.hzd.importer.application;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import de.hzd.importer.adapter.strapi.StrapiMemberAdapter;
import de.hzd.importer.adapter.strapi.StrapiMemberAdapter.StrapiMemberSnapshot;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.domain.Member;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import de.hzd.importer.port.CsvDogReaderPort;
import de.hzd.importer.port.CsvMemberReaderPort;
import de.hzd.importer.port.DogSyncPort;
import de.hzd.importer.port.ImportJobLogPort;
import de.hzd.importer.port.ImportJobRepositoryPort;
import de.hzd.importer.port.MemberSyncPort;
import de.hzd.util.DateHelper;
import de.hzd.util.Ticker;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ImportService {

	private static final Logger LOG = Logger.getLogger(ImportService.class);

	@Inject
	ImporterConfig config;

	@Inject
	CsvMemberReaderPort memberReader;

	@Inject
	CsvDogReaderPort dogReader;

	@Inject
	MemberSyncPort memberSyncPort;

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	@Inject
	DogSyncPort dogSyncPort;

	@Inject
	ImportJobRepositoryPort jobRepository;

	@Inject
	ImportJobLogPort jobLog;

	@Inject
	ImportReportNotifier reportNotifier;

	@Inject
	ManagedExecutor managedExecutor;

	public Optional<UUID> startImportAsync() {
		UUID jobId = UUID.randomUUID();
		if (!jobRepository.tryAcquireLock(jobId)) {
			LOG.warn("Import rejected: another job is already running");
			return Optional.empty();
		}
		managedExecutor.runAsync(() -> runImport(jobId));
		return Optional.of(jobId);
	}

	public Optional<ImportJob> getJob(UUID jobId) {
		return jobRepository.findById(jobId);
	}

	public Optional<ImportJob> findRunningJob() {
		return jobRepository.findRunningJob();
	}

	void runImport(UUID jobId) {
		runImportInternal(jobId);
	}

	private void runImportInternal(UUID jobId) {
		long t0 = System.currentTimeMillis();
		MDC.put("jobId", jobId.toString());
		jobLog.start(jobId);
		jobLog.info("Import job %s started", jobId);
		ImportStatistics statistics = ImportStatistics.empty();
		ImportJob finishedJob = null;
		try {
			Path membersPath = Path.of(config.csv().membersPath());
			Path dogsPath = Path.of(config.csv().dogsPath());

			List<Member> members = memberReader.read(membersPath);
			jobLog.info("Loaded %d members from %s", members.size(), membersPath);
			strapiMemberAdapter.setCsvMembers(members);

			List<Dog> dogs = dogReader.read(dogsPath);
			jobLog.info("Loaded %d dogs from %s", dogs.size(), dogsPath);

			Collection<StrapiMemberAdapter.StrapiMemberSnapshot> strapiMembers =
					strapiMemberAdapter.fetchAllMembers();
			jobLog.info("Loaded %d members from Strapi", strapiMembers.size());

			int authenticatedRoleId = strapiMemberAdapter.fetchAuthenticatedRoleId();

			strapiMemberAdapter.setImportCache(strapiMembers);
			strapiMemberAdapter.setAuthenticatedRoleId(authenticatedRoleId);
			
			try {
				jobLog.info("start import Members");
				statistics = importMembers(members, statistics);
				
				jobLog.info("start import Dogs");
				statistics = importDogs(dogs, statistics);
			} finally {
				strapiMemberAdapter.clearImportCache();
			}

			finishedJob = finishJob(jobId, ImportJobStatus.SUCCESS, "Import completed successfully", statistics);
			jobLog.info("Import job %s finished successfully", jobId);
		} catch (Exception exception) {
			jobLog.error("Import job %s failed", exception, jobId);
			finishedJob = finishJob(
				jobId,
				ImportJobStatus.FAILED,
				exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName(),
				statistics
			);
		} finally {
			jobLog.info("Der Job %s dauerte %s", jobId, DateHelper.formatDauer(System.currentTimeMillis() - t0));
			if (finishedJob != null) {
				reportNotifier.sendFor(finishedJob);
			}
			jobLog.clear();
			MDC.remove("jobId");
		}
	}

	private ImportStatistics importMembers(
		List<Member> members,
		ImportStatistics statistics
	) {
		Ticker logTicker = new Ticker(10000l);
		long t0 = System.currentTimeMillis();
		int i=0;
		for (Member member : members) {
			final int j = i++;
			logTicker.tick(() -> jobLog.info(Ticker.formatProceedingMessage(t0, members.size(), j, "Strapi user")));
			try {
				Member memberToSync = enrichWithStrapiIdentity(member);
				MemberSyncPort.SyncResult result = memberSyncPort.syncInStrapi(memberToSync);
				statistics = switch (result) {
					case CREATED -> statistics.withMembersCreated(1);
					case UPDATED -> statistics.withMembersUpdated(1);
					case DELETED -> statistics;
					case SKIPPED -> statistics.withMembersSkipped(1);
				};
			} catch (RuntimeException exception) {
				jobLog.error(
					"Failed to import member cId=%d email=%s",
					exception,
					member.cId(),
					member.strapiEmail()
				);
				statistics = statistics.withMembersFailed(1);
			}
		}
		return statistics;
	}

	private Member enrichWithStrapiIdentity(
		Member member
	) {
		StrapiMemberSnapshot snapshot = this.strapiMemberAdapter.cachedMemberByCid(member.cId());
		if (snapshot == null) {
			return member;
		}
		Optional<Boolean> pmd = snapshot.publishMyData();
		if(member.cFlagBreeder().orElse(Boolean.TRUE).booleanValue()) {
			pmd = Optional.of(Boolean.TRUE);
		}
		return member.withStrapiIdentity(
			snapshot.documentId(),
			snapshot.id(),
			pmd
		);
	}

	private ImportStatistics importDogs(List<Dog> dogs, ImportStatistics statistics) {
		DogSyncPort.BreederPreparationResult breederStats = dogSyncPort.prepareBreeders(dogs);
		statistics = statistics.withBreedersCreated(breederStats.breedersCreated());

		Ticker logTicker = new Ticker(10000l);
		long t0 = System.currentTimeMillis();
		int i=0;
		for (Dog dog : dogs) {
			final int j = i++;
			logTicker.tick(() -> jobLog.info(Ticker.formatProceedingMessage(t0, dogs.size(), j, "Dog")));
			try {
				DogSyncPort.SyncResult result = dogSyncPort.sync(dog);
				statistics = result == DogSyncPort.SyncResult.CREATED
					? statistics.withDogsCreated(1)
					: statistics.withDogsUpdated(1);
			} catch (RuntimeException exception) {
				jobLog.error("Failed to import dog cId=%d", exception, dog.cId());
				statistics = statistics.withDogsFailed(1);
			}
		}
		return statistics;
	}

	private ImportJob finishJob(
		UUID jobId,
		ImportJobStatus status,
		String message,
		ImportStatistics statistics
	) {
		ImportJob finishedJob = new ImportJob(
			jobId,
			status,
			jobRepository.findById(jobId).map(ImportJob::startedAt).orElse(Instant.now()),
			Instant.now(),
			message,
			statistics
		);
		jobRepository.save(finishedJob);
		return finishedJob;
	}
}
