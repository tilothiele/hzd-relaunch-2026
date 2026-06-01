package de.hzd.importer.port;

import de.hzd.importer.domain.ImportJob;
import java.util.Optional;
import java.util.UUID;

public interface ImportJobRepositoryPort {
	Optional<ImportJob> findRunningJob();

	Optional<ImportJob> findById(UUID id);

	ImportJob save(ImportJob job);

	boolean tryAcquireLock(UUID jobId);
}
