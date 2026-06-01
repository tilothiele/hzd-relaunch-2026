package de.hzd.importer.infrastructure.scheduler;

import de.hzd.importer.application.ImportService;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ImportScheduler {

	private static final Logger LOG = Logger.getLogger(ImportScheduler.class);

	@Inject
	ImportService importService;

	@Inject
	ImporterConfig config;

	@Scheduled(cron = "{importer.scheduler.cron}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
	void runScheduledImport() {
		if (!config.scheduler().enabled()) {
			return;
		}
		LOG.info("Scheduled import triggered");
		importService.startImportAsync().ifPresentOrElse(
			jobId -> LOG.infof("Scheduled import started with jobId=%s", jobId),
			() -> LOG.info("Scheduled import skipped: another job is already running")
		);
	}
}
