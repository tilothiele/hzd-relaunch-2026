package de.hzd.importer.domain;

import java.time.Instant;
import java.util.UUID;

public record ImportJob(
		UUID id,
		ImportJobStatus status,
		Instant startedAt,
		Instant finishedAt,
		String message,
		ImportStatistics statistics
) {
	public static ImportJob running(UUID id, Instant startedAt) {
		return new ImportJob(
			id,
			ImportJobStatus.RUNNING,
			startedAt,
			null,
			null,
			ImportStatistics.empty()
		);
	}

	public ImportJob withStatus(
		ImportJobStatus status,
		Instant finishedAt,
		String message,
		ImportStatistics statistics
	) {
		return new ImportJob(id, status, startedAt, finishedAt, message, statistics);
	}
}
