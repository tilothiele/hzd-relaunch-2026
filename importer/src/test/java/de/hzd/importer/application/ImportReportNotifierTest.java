package de.hzd.importer.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.port.ImportJobLogArchivePort;
import de.hzd.importer.port.ImportJobLogPort;
import de.hzd.importer.port.ImportReportMailPort;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ImportReportNotifierTest {

	@Test
	void archivesAndSendsSnapshotFromAggregator() {
		ImportJobLogPort jobLog = mock(ImportJobLogPort.class);
		ImportJobLogArchivePort archive = mock(ImportJobLogArchivePort.class);
		ImportReportMailPort reportMail = mock(ImportReportMailPort.class);
		ImportReportNotifier notifier = notifier(jobLog, archive, reportMail);

		ImportJob job = job();
		ImportJobLog log = ImportJobLog.empty(job.id());
		when(jobLog.snapshot()).thenReturn(log);

		notifier.sendFor(job);

		verify(archive).archive(job, log);
		verify(reportMail).send(job, log);
	}

	@Test
	void continuesMailAfterArchiveFailure() {
		ImportJobLogPort jobLog = mock(ImportJobLogPort.class);
		ImportJobLogArchivePort archive = mock(ImportJobLogArchivePort.class);
		ImportReportMailPort reportMail = mock(ImportReportMailPort.class);
		ImportReportNotifier notifier = notifier(jobLog, archive, reportMail);
		ImportJob job = job();
		ImportJobLog log = ImportJobLog.empty(job.id());
		when(jobLog.snapshot()).thenReturn(log);
		doThrow(new RuntimeException("disk full")).when(archive).archive(any(), any());

		notifier.sendFor(job);

		verify(reportMail).send(job, log);
	}

	@Test
	void swallowsMailFailures() {
		ImportJobLogPort jobLog = mock(ImportJobLogPort.class);
		ImportJobLogArchivePort archive = mock(ImportJobLogArchivePort.class);
		ImportReportMailPort reportMail = mock(ImportReportMailPort.class);
		ImportReportNotifier notifier = notifier(jobLog, archive, reportMail);
		ImportJob job = job();
		when(jobLog.snapshot()).thenReturn(ImportJobLog.empty(job.id()));
		doThrow(new RuntimeException("smtp down")).when(reportMail).send(any(), any());

		notifier.sendFor(job);

		verify(archive).archive(any(), any());
		verify(reportMail).send(any(), any());
	}

	private static ImportReportNotifier notifier(
		ImportJobLogPort jobLog,
		ImportJobLogArchivePort archive,
		ImportReportMailPort reportMail
	) {
		ImportReportNotifier notifier = new ImportReportNotifier();
		setField(notifier, "jobLog", jobLog);
		setField(notifier, "logArchive", archive);
		setField(notifier, "reportMail", reportMail);
		return notifier;
	}

	private static ImportJob job() {
		Instant now = Instant.now();
		return new ImportJob(
			UUID.randomUUID(),
			ImportJobStatus.SUCCESS,
			now,
			now,
			"ok",
			ImportStatistics.empty()
		);
	}

	private static void setField(Object target, String name, Object value) {
		try {
			var field = target.getClass().getDeclaredField(name);
			field.setAccessible(true);
			field.set(target, value);
		} catch (ReflectiveOperationException exception) {
			throw new IllegalStateException(exception);
		}
	}
}
