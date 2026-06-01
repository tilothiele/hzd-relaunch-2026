package de.hzd.importer.application;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter;
import de.hzd.importer.domain.DeleteAllUsersJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.port.DeleteAllUsersJobRepositoryPort;
import de.hzd.util.DateHelper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

@ApplicationScoped
public class AuthentikUserAdminService {

	private static final Logger LOG = Logger.getLogger(AuthentikUserAdminService.class);

	@Inject
	AuthentikUserAdapter authentikUserAdapter;

	@Inject
	DeleteAllUsersJobRepositoryPort jobRepository;

	@Inject
	ManagedExecutor managedExecutor;

	public Optional<UUID> startDeleteAllUsersAsync() {
		UUID jobId = UUID.randomUUID();
		if (!jobRepository.tryAcquireLock(jobId)) {
			LOG.warn("Delete-all-users rejected: another job is already running");
			return Optional.empty();
		}
		managedExecutor.runAsync(() -> runDeleteAllUsers(jobId));
		return Optional.of(jobId);
	}

	public Optional<DeleteAllUsersJob> getJob(UUID jobId) {
		return jobRepository.findById(jobId);
	}

	void runDeleteAllUsers(UUID jobId) {
		long t0 = System.currentTimeMillis();
		runDeleteAllUsersInternal(jobId);
		Log.infof(
			"Delete-all-users job %s dauerte %s",
			jobId.toString(),
			DateHelper.formatDauer(System.currentTimeMillis() - t0)
		);
	}

	private void runDeleteAllUsersInternal(UUID jobId) {
		MDC.put("jobId", jobId.toString());
		LOG.infof("Delete-all-users job %s started", jobId);
		try {
			AuthentikUserAdapter.DeleteAllUsersResult result =
				authentikUserAdapter.deleteAllUsers();
			finishJob(
				jobId,
				ImportJobStatus.SUCCESS,
				"Delete-all-users completed successfully",
				result.deleted(),
				result.total()
			);
			LOG.infof(
				"Delete-all-users job %s finished successfully (%d/%d deleted)",
				jobId,
				result.deleted(),
				result.total()
			);
		} catch (Exception exception) {
			LOG.errorf(exception, "Delete-all-users job %s failed", jobId);
			finishJob(
				jobId,
				ImportJobStatus.FAILED,
				exception.getMessage() != null
					? exception.getMessage()
					: exception.getClass().getSimpleName(),
				0,
				0
			);
		} finally {
			MDC.remove("jobId");
		}
	}

	private void finishJob(
		UUID jobId,
		ImportJobStatus status,
		String message,
		int usersDeleted,
		int usersTotal
	) {
		DeleteAllUsersJob finishedJob = jobRepository.findById(jobId)
			.orElseThrow()
			.withStatus(
				status,
				Instant.now(),
				message,
				usersDeleted,
				usersTotal
			);
		jobRepository.save(finishedJob);
	}
}
