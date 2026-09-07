package de.hzd.importer.port;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;

public interface ImportReportMailPort {

	void send(ImportJob job, ImportJobLog log);
}
