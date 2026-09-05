package de.hzd.importer.application;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.port.ImportJobLogArchivePort;
import de.hzd.importer.port.ImportJobLogPort;
import de.hzd.importer.port.ImportReportMailPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ImportReportNotifier {

	private static final Logger LOG = Logger.getLogger(ImportReportNotifier.class);

	@Inject
	ImportJobLogPort jobLog;

	@Inject
	ImportJobLogArchivePort logArchive;

	@Inject
	ImportReportMailPort reportMail;

	public void sendFor(ImportJob job) {
		ImportJobLog snapshot = jobLog.snapshot();
		try {
			logArchive.archive(job, snapshot);
		} catch (RuntimeException exception) {
			LOG.errorf(exception, "Failed to write import job log for job %s", job.id());
		}
		try {
			reportMail.send(job, snapshot);
		} catch (RuntimeException exception) {
			LOG.errorf(exception, "Failed to send import report mail for job %s", job.id());
		}
	}
}
