package de.hzd.importer.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.support.QuarkusIntegrationTest;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusIntegrationTest
public class ImportJobRepositoryTest {
	@Inject
	ImportJobRepository repository;

	@Test
	void preventsConcurrentLocks() {
		UUID firstJob = UUID.randomUUID();
		UUID secondJob = UUID.randomUUID();

		assertTrue(repository.tryAcquireLock(firstJob));
		assertFalse(repository.tryAcquireLock(secondJob));

		var finishedJob = repository.findById(firstJob).orElseThrow();
		repository.save(
			finishedJob.withStatus(
				ImportJobStatus.SUCCESS,
				Instant.now(),
				"done",
				finishedJob.statistics()
			)
		);

		assertTrue(repository.tryAcquireLock(secondJob));

		var secondRunning = repository.findById(secondJob).orElseThrow();
		repository.save(
			secondRunning.withStatus(
				ImportJobStatus.SUCCESS,
				Instant.now(),
				"done",
				secondRunning.statistics()
			)
		);
	}
}
