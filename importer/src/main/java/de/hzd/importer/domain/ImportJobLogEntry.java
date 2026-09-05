package de.hzd.importer.domain;

import java.time.Instant;

public record ImportJobLogEntry(
		Instant timestamp,
		ImportJobLogLevel level,
		String message
) {
}
