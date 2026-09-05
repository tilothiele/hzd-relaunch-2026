package de.hzd.importer.application;

import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobLogEntry;
import de.hzd.importer.domain.ImportJobLogLevel;
import de.hzd.importer.port.ImportJobLogPort;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ImportJobLogAggregator implements ImportJobLogPort {

	private static final Logger LOG = Logger.getLogger(ImportJobLogAggregator.class);

	private final Object lock = new Object();
	private UUID jobId;
	private Instant startedAt;
	private final List<ImportJobLogEntry> entries = new ArrayList<>();

	@Override
	public void start(UUID jobId) {
		synchronized (lock) {
			this.jobId = jobId;
			this.startedAt = Instant.now();
			this.entries.clear();
		}
	}

	@Override
	public void info(String format, Object... args) {
		String message = formatMessage(format, args);
		append(ImportJobLogLevel.INFO, message);
		LOG.info(message);
	}

	@Override
	public void warn(String format, Object... args) {
		String message = formatMessage(format, args);
		append(ImportJobLogLevel.WARN, message);
		LOG.warn(message);
	}

	@Override
	public void error(String format, Object... args) {
		String message = formatMessage(format, args);
		append(ImportJobLogLevel.ERROR, message);
		LOG.error(message);
	}

	@Override
	public void error(String format, Throwable error, Object... args) {
		String message = formatMessage(format, args);
		if (error != null) {
			String detail = error.getMessage() != null
				? error.getMessage()
				: error.getClass().getSimpleName();
			message = message + " (" + detail + ")";
			append(ImportJobLogLevel.ERROR, message);
			LOG.error(message, error);
			return;
		}
		append(ImportJobLogLevel.ERROR, message);
		LOG.error(message);
	}

	@Override
	public ImportJobLog snapshot() {
		synchronized (lock) {
			UUID snapshotJobId = jobId != null ? jobId : new UUID(0, 0);
			Instant snapshotStartedAt = startedAt != null ? startedAt : Instant.now();
			return new ImportJobLog(snapshotJobId, snapshotStartedAt, List.copyOf(entries));
		}
	}

	@Override
	public void clear() {
		synchronized (lock) {
			jobId = null;
			startedAt = null;
			entries.clear();
		}
	}

	private void append(ImportJobLogLevel level, String message) {
		synchronized (lock) {
			entries.add(new ImportJobLogEntry(Instant.now(), level, message));
		}
	}

	private static String formatMessage(String format, Object... args) {
		if (format == null) {
			return "";
		}
		if (args == null || args.length == 0) {
			return format;
		}
		return String.format(format, args);
	}
}
