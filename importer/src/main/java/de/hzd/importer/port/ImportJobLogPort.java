package de.hzd.importer.port;

import de.hzd.importer.domain.ImportJobLog;
import java.util.UUID;

public interface ImportJobLogPort {

	void start(UUID jobId);

	void info(String format, Object... args);

	void warn(String format, Object... args);

	void error(String format, Object... args);

	void error(String format, Throwable error, Object... args);

	ImportJobLog snapshot();

	void clear();
}
