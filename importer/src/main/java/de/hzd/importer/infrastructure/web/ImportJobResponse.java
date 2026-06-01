package de.hzd.importer.infrastructure.web;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import java.time.Instant;
import java.util.UUID;

public record ImportJobResponse(
		UUID jobId,
		ImportJobStatus status,
		Instant startedAt,
		Instant finishedAt,
		String message,
		ImportStatistics statistics
) {
	public static ImportJobResponse from(ImportJob job) {
		return new ImportJobResponse(
			job.id(),
			job.status(),
			job.startedAt(),
			job.finishedAt(),
			job.message(),
			job.statistics()
		);
	}
}
