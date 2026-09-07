package de.hzd.importer.port;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;

public interface ImportJobLogArchivePort {

	void archive(ImportJob job, ImportJobLog log);
}
