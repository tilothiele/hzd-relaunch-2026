package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.DeleteAllUsersJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.port.DeleteAllUsersJobRepositoryPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class DeleteAllUsersJobRepository implements DeleteAllUsersJobRepositoryPort {

	@Inject
	JobExecutionGuard jobExecutionGuard;

	@Override
	@Transactional
	public Optional<DeleteAllUsersJob> findRunningJob() {
		return DeleteAllUsersJobEntity
			.<DeleteAllUsersJobEntity>find("status", ImportJobStatus.RUNNING)
			.firstResultOptional()
			.map(this::toDomain);
	}

	@Override
	@Transactional
	public Optional<DeleteAllUsersJob> findById(UUID id) {
		return DeleteAllUsersJobEntity
			.<DeleteAllUsersJobEntity>findByIdOptional(id)
			.map(this::toDomain);
	}

	@Override
	@Transactional
	public DeleteAllUsersJob save(DeleteAllUsersJob job) {
		DeleteAllUsersJobEntity entity = DeleteAllUsersJobEntity
			.<DeleteAllUsersJobEntity>findById(job.id());
		if (entity == null) {
			entity = new DeleteAllUsersJobEntity();
			entity.id = job.id();
		}
		entity.status = job.status();
		entity.startedAt = job.startedAt();
		entity.finishedAt = job.finishedAt();
		entity.message = job.message();
		entity.usersDeleted = job.usersDeleted();
		entity.usersTotal = job.usersTotal();
		entity.persist();
		return toDomain(entity);
	}

	@Override
	@Transactional
	public boolean tryAcquireLock(UUID jobId) {
		if (jobExecutionGuard.hasRunningJob()) {
			return false;
		}

		DeleteAllUsersJobEntity entity = new DeleteAllUsersJobEntity();
		entity.id = jobId;
		entity.status = ImportJobStatus.RUNNING;
		entity.startedAt = Instant.now();
		entity.usersDeleted = 0;
		entity.usersTotal = 0;
		entity.persist();
		return true;
	}

	private DeleteAllUsersJob toDomain(DeleteAllUsersJobEntity entity) {
		return new DeleteAllUsersJob(
			entity.id,
			entity.status,
			entity.startedAt,
			entity.finishedAt,
			entity.message,
			entity.usersDeleted,
			entity.usersTotal
		);
	}
}
