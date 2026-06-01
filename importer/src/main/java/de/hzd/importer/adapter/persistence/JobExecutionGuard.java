package de.hzd.importer.adapter.persistence;

import de.hzd.importer.domain.ImportJobStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class JobExecutionGuard {

	public boolean hasRunningJob() {
		Long importRunning = ImportJobEntity.count("status", ImportJobStatus.RUNNING);
		Long deleteRunning = DeleteAllUsersJobEntity.count("status", ImportJobStatus.RUNNING);
		return hasRunningCount(importRunning) || hasRunningCount(deleteRunning);
	}

	@Transactional
	public void failAllRunningJobs() {
		ImportJobEntity.update(
			"status = ?1 where status = ?2",
			ImportJobStatus.FAILED,
			ImportJobStatus.RUNNING
		);
		DeleteAllUsersJobEntity.update(
			"status = ?1 where status = ?2",
			ImportJobStatus.FAILED,
			ImportJobStatus.RUNNING
		);
	}

	private boolean hasRunningCount(Long count) {
		return count != null && count > 0;
	}
}
