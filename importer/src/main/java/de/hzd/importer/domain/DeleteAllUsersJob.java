package de.hzd.importer.domain;

import java.time.Instant;
import java.util.UUID;

public record DeleteAllUsersJob(
		UUID id,
		ImportJobStatus status,
		Instant startedAt,
		Instant finishedAt,
		String message,
		int usersDeleted,
		int usersTotal
) {
	public DeleteAllUsersJob withStatus(
		ImportJobStatus status,
		Instant finishedAt,
		String message,
		int usersDeleted,
		int usersTotal
	) {
		return new DeleteAllUsersJob(
			id,
			status,
			startedAt,
			finishedAt,
			message,
			usersDeleted,
			usersTotal
		);
	}
}
