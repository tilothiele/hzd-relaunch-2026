package de.hzd.importer.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ImportJobLog(
		UUID jobId,
		Instant startedAt,
		List<ImportJobLogEntry> entries
) {
	public ImportJobLog {
		entries = List.copyOf(entries);
	}

	public static ImportJobLog empty(UUID jobId) {
		return new ImportJobLog(jobId, Instant.now(), List.of());
	}

	public int size() {
		return entries.size();
	}
}
