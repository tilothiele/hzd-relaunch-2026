package de.hzd.importer.port;

import de.hzd.importer.domain.DeleteAllUsersJob;
import java.util.Optional;
import java.util.UUID;

public interface DeleteAllUsersJobRepositoryPort {
	Optional<DeleteAllUsersJob> findRunningJob();

	Optional<DeleteAllUsersJob> findById(UUID id);

	DeleteAllUsersJob save(DeleteAllUsersJob job);

	boolean tryAcquireLock(UUID jobId);
}
