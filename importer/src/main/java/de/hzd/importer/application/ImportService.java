package de.hzd.importer.application;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import de.hzd.importer.adapter.csv.CsvUploadStore;
import de.hzd.importer.adapter.persistence.CsvSnapshotRepository;
import de.hzd.importer.adapter.csv.UploadedCsvFiles;
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
	CsvUploadStore csvUploadStore;

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
	CsvSnapshotRepository csvSnapshotRepository;

	@Inject
	ImportHtmlReportWriter htmlReport;

	@Inject
	ManagedExecutor managedExecutor;

	public Optional<UUID> startImportAsync() {
		return startImportFromPaths(
			Path.of(config.csv().membersPath()),
			Path.of(config.csv().dogsPath()),
			null
		);
	}

	public Optional<UUID> startImportFromUpload(Path membersSource, Path dogsSource) {
		UploadedCsvFiles uploaded = csvUploadStore.store(membersSource, dogsSource);
		Optional<UUID> jobId = startImportFromPaths(
			uploaded.membersPath(),
			uploaded.dogsPath(),
			uploaded
		);
		if (jobId.isEmpty()) {
			uploaded.delete();
		}
		return jobId;
	}

	private Optional<UUID> startImportFromPaths(
		Path membersPath,
		Path dogsPath,
		UploadedCsvFiles uploaded
	) {
		UUID jobId = UUID.randomUUID();
		if (!jobRepository.tryAcquireLock(jobId)) {
			LOG.warn("Import rejected: another job is already running");
			return Optional.empty();
		}
		managedExecutor.runAsync(() -> runImport(jobId, membersPath, dogsPath, uploaded));
		return Optional.of(jobId);
	}

	public Optional<ImportJob> getJob(UUID jobId) {
		return jobRepository.findById(jobId);
	}

	public Optional<ImportJob> findRunningJob() {
		return jobRepository.findRunningJob();
	}

	void runImport(UUID jobId) {
		runImport(
			jobId,
			Path.of(config.csv().membersPath()),
			Path.of(config.csv().dogsPath()),
			null
		);
	}

	private void runImport(
		UUID jobId,
		Path membersPath,
		Path dogsPath,
		UploadedCsvFiles uploaded
	) {
		runImportInternal(jobId, membersPath, dogsPath, uploaded);
	}

	private void runImportInternal(
		UUID jobId,
		Path membersPath,
		Path dogsPath,
		UploadedCsvFiles uploaded
	) {
		long t0 = System.currentTimeMillis();
		MDC.put("jobId", jobId.toString());
		jobLog.start(jobId);
		jobLog.info("Import job %s started", jobId);
		jobLog.info(
			"Strapi base URL: %s (API-Token %s)",
			config.strapi().baseUrl(),
			config.strapi().apiToken().filter(token -> !token.isBlank()).isPresent()
				? "gesetzt"
				: "nicht gesetzt"
		);
		ImportStatistics statistics = ImportStatistics.empty();
		ImportJob finishedJob = null;
		CsvSnapshotDiffer.Result memberDiff = null;
		CsvSnapshotDiffer.Result dogDiff = null;
		CsvSnapshotDiffer.Result memberComparison = null;
		CsvSnapshotDiffer.Result dogComparison = null;
		boolean membersHadBaseline = false;
		boolean dogsHadBaseline = false;
		List<Member> members = List.of();
		List<Dog> dogs = List.of();
		Integer generation = null;
		Instant startedAt = Instant.now();
		try {

			members = memberReader.read(membersPath);
			jobLog.info("Loaded %d members from %s", members.size(), membersPath);
			strapiMemberAdapter.setCsvMembers(members);

			dogs = dogReader.read(dogsPath);
			jobLog.info("Loaded %d dogs from %s", dogs.size(), dogsPath);

			generation = csvSnapshotRepository.beginImport(jobId, startedAt);
			jobLog.info("CSV-Generation %d", generation);

			List<Member> previousMembers = csvSnapshotRepository.loadLatestMembers();
			List<Dog> previousDogs = csvSnapshotRepository.loadLatestDogs();
			membersHadBaseline = !previousMembers.isEmpty();
			dogsHadBaseline = !previousDogs.isEmpty();
			memberComparison = CsvSnapshotDiffer.compareMembers(previousMembers, members);
			dogComparison = CsvSnapshotDiffer.compareDogs(previousDogs, dogs);
			if (membersHadBaseline) {
				memberDiff = memberComparison;
				assertPlausible("Mitglieder", memberDiff);
			} else {
				jobLog.info("Mitglieder: Plausibilitätsprüfung übersprungen, Tabelle ist leer");
			}
			if (dogsHadBaseline) {
				dogDiff = dogComparison;
				assertPlausible("Hunde", dogDiff);
			} else {
				jobLog.info("Hunde: Plausibilitätsprüfung übersprungen, Tabelle ist leer");
			}

			List<Member> membersToSync = rowsToSync(members, memberComparison, Member::cId);
			List<Dog> dogsToSync = rowsToSync(dogs, dogComparison, Dog::cId);
			statistics = statistics.withMembersSkipped(members.size() - membersToSync.size());
			jobLog.info(
				"Mitglieder: %d zur Synchronisation, %d unverändert übersprungen",
				membersToSync.size(),
				members.size() - membersToSync.size()
			);
			jobLog.info(
				"Hunde: %d zur Synchronisation, %d unverändert übersprungen",
				dogsToSync.size(),
				dogs.size() - dogsToSync.size()
			);

			Collection<StrapiMemberAdapter.StrapiMemberSnapshot> strapiMembers =
					strapiMemberAdapter.fetchAllMembers();
			jobLog.info("Loaded %d members from Strapi", strapiMembers.size());

			int authenticatedRoleId = strapiMemberAdapter.fetchAuthenticatedRoleId();

			strapiMemberAdapter.setImportCache(strapiMembers);
			strapiMemberAdapter.setAuthenticatedRoleId(authenticatedRoleId);
			strapiMemberAdapter.setPreviousMembers(previousMembers);
			dogSyncPort.setPreviousDogs(previousDogs);

			try {
				jobLog.info("start import Members");
				statistics = importMembers(membersToSync, statistics);

				jobLog.info("start import Dogs");
				statistics = importDogs(dogsToSync, statistics);
			} finally {
				strapiMemberAdapter.clearImportCache();
				dogSyncPort.clearPreviousDogs();
			}

			csvSnapshotRepository.append(generation, members, dogs);
			jobLog.info(
				"CSV-Datenstand Generation %d gespeichert (%d Mitglieder, %d Hunde)",
				generation,
				members.size(),
				dogs.size()
			);

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
			if (generation != null) {
				try {
					csvSnapshotRepository.finishImport(
						jobId,
						Instant.now(),
						members.size(),
						dogs.size(),
						changeCount(memberComparison, true),
						changeCount(memberComparison, false),
						changeCount(dogComparison, true),
						changeCount(dogComparison, false)
					);
				} catch (RuntimeException exception) {
					jobLog.error("Importlauf konnte nicht abgeschlossen werden", exception);
				}
			}
			jobLog.info("Der Job %s dauerte %s", jobId, DateHelper.formatDauer(System.currentTimeMillis() - t0));
			if (membersHadBaseline || dogsHadBaseline) {
				try {
					Path reportFile = htmlReport.write(jobId, finishedJob, memberDiff, dogDiff);
					jobLog.info("HTML-Report geschrieben: %s", reportFile);
				} catch (RuntimeException exception) {
					jobLog.error("HTML-Report konnte nicht geschrieben werden", exception);
				}
			} else {
				jobLog.info("HTML-Report übersprungen, CSV-Tabellen waren leer");
			}
			if (finishedJob != null) {
				reportNotifier.sendFor(finishedJob);
			}
			jobLog.clear();
			if (uploaded != null) {
				uploaded.delete();
			}
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
				statistics = switch (result) {
					case CREATED -> statistics.withDogsCreated(1);
					case UPDATED -> statistics.withDogsUpdated(1);
					case SKIPPED -> statistics;
				};
			} catch (RuntimeException exception) {
				jobLog.error("Failed to import dog cId=%d", exception, dog.cId());
				statistics = statistics.withDogsFailed(1);
			}
		}
		return statistics;
	}

	private static int changeCount(CsvSnapshotDiffer.Result result, boolean changed) {
		if (result == null) {
			return 0;
		}
		return changed ? result.changedCount() : result.newCount();
	}

	private static <T> List<T> rowsToSync(
		List<T> rows,
		CsvSnapshotDiffer.Result comparison,
		Function<T, Integer> cId
	) {
		Set<Integer> cIds = CsvSnapshotDiffer.cIdsToSync(comparison);
		return rows.stream().filter(row -> cIds.contains(cId.apply(row))).toList();
	}

	private void assertPlausible(String label, CsvSnapshotDiffer.Result result) {
		int threshold = config.csv().plausibilityThreshold();
		jobLog.info(
			"%s: %d neu, %d mit Abweichungen, %d entfernt (Schwelle %d)",
			label,
			result.newCount(),
			result.changedCount(),
			result.removedCount(),
			threshold
		);
		if (result.changedCount() > threshold || result.newCount() > threshold) {
			throw new CsvPlausibilityException(
				label + ": Plausibilitätsprüfung fehlgeschlagen ("
					+ result.changedCount() + " Abweichungen, "
					+ result.newCount() + " neu, Schwelle " + threshold + ")"
			);
		}
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
