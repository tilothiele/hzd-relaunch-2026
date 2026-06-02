package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.port.ImportJobRepositoryPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ImportJobRepository implements ImportJobRepositoryPort {

	@Inject
	EntityManager entityManager;

	@Inject
	JobExecutionGuard jobExecutionGuard;

	@Override
	@Transactional
	public Optional<ImportJob> findRunningJob() {
		return ImportJobEntity
			.<ImportJobEntity>find("status", ImportJobStatus.RUNNING)
			.firstResultOptional()
			.map(this::toDomain);
	}

	@Override
	@Transactional
	public Optional<ImportJob> findById(UUID id) {
		return ImportJobEntity.<ImportJobEntity>findByIdOptional(id).map(this::toDomain);
	}

	@Override
	@Transactional
	public ImportJob save(ImportJob job) {
		ImportJobEntity entity = ImportJobEntity.<ImportJobEntity>findById(job.id());
		if (entity == null) {
			entity = new ImportJobEntity();
			entity.id = job.id();
		}
		entity.status = job.status();
		entity.startedAt = job.startedAt();
		entity.finishedAt = job.finishedAt();
		entity.message = job.message();
		entity.membersCreated = job.statistics().membersCreated();
		entity.membersUpdated = job.statistics().membersUpdated();
		entity.membersSkipped = job.statistics().membersSkipped();
		entity.membersFailed = job.statistics().membersFailed();
		entity.dogsCreated = job.statistics().dogsCreated();
		entity.dogsUpdated = job.statistics().dogsUpdated();
		entity.dogsFailed = job.statistics().dogsFailed();
		entity.breedersCreated = job.statistics().breedersCreated();
		entity.persist();
		return toDomain(entity);
	}

	@Override
	@Transactional
	public boolean tryAcquireLock(UUID jobId) {
		if (jobExecutionGuard.hasRunningJob()) {
			return false;
		}
		ImportJobEntity entity = new ImportJobEntity();
		entity.id = jobId;
		entity.status = ImportJobStatus.RUNNING;
		entity.startedAt = Instant.now();
		entity.membersCreated = 0;
		entity.membersUpdated = 0;
		entity.membersSkipped = 0;
		entity.membersFailed = 0;
		entity.dogsCreated = 0;
		entity.dogsUpdated = 0;
		entity.dogsFailed = 0;
		entity.breedersCreated = 0;
		entity.persist();
		return true;
	}

	@Transactional
	public void failRunningJobs() {
		jobExecutionGuard.failAllRunningJobs();
	}

	private ImportJob toDomain(ImportJobEntity entity) {
		return new ImportJob(
			entity.id,
			entity.status,
			entity.startedAt,
			entity.finishedAt,
			entity.message,
			new ImportStatistics(
				entity.membersCreated,
				entity.membersUpdated,
				entity.membersSkipped,
				entity.membersFailed,
				entity.dogsCreated,
				entity.dogsUpdated,
				entity.dogsFailed,
				entity.breedersCreated
			)
		);
	}
}
