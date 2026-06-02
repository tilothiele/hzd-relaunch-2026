package de.hzd.importer.infrastructure.web;

import de.hzd.importer.domain.DeleteAllUsersJob;
import de.hzd.importer.domain.ImportJobStatus;
import java.time.Instant;
import java.util.UUID;

public record DeleteAllUsersJobResponse(
		UUID jobId,
		ImportJobStatus status,
		Instant startedAt,
		Instant finishedAt,
		String message,
		int usersDeleted,
		int usersTotal
) {
	public static DeleteAllUsersJobResponse from(DeleteAllUsersJob job) {
		return new DeleteAllUsersJobResponse(
			job.id(),
			job.status(),
			job.startedAt(),
			job.finishedAt(),
			job.message(),
			job.usersDeleted(),
			job.usersTotal()
		);
	}
}
