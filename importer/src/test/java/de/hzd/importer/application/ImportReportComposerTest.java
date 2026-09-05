package de.hzd.importer.application;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobLogEntry;
import de.hzd.importer.domain.ImportJobLogLevel;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportReportMail;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ImportReportComposerTest {

	@Test
	void buildsDashboardAndDetailedLog() {
		ImporterConfig config = mock(ImporterConfig.class);
		ImporterConfig.MailConfig mailConfig = mock(ImporterConfig.MailConfig.class);
		when(config.mail()).thenReturn(mailConfig);
		when(mailConfig.subjectPrefix()).thenReturn("[HZD Import]");

		ImportReportComposer composer = new ImportReportComposer();
		setConfig(composer, config);

		UUID jobId = UUID.fromString("22222222-2222-2222-2222-222222222222");
		Instant startedAt = Instant.parse("2026-09-05T18:00:00Z");
		Instant finishedAt = Instant.parse("2026-09-05T18:01:05Z");
		ImportJob job = new ImportJob(
			jobId,
			ImportJobStatus.SUCCESS,
			startedAt,
			finishedAt,
			"Import completed successfully",
			new ImportStatistics(1, 2, 3, 0, 4, 5, 0, 1)
		);
		ImportJobLog log = new ImportJobLog(
			jobId,
			startedAt,
			List.of(
				new ImportJobLogEntry(startedAt, ImportJobLogLevel.INFO, "Import job started"),
				new ImportJobLogEntry(finishedAt, ImportJobLogLevel.INFO, "Loaded 1 members")
			)
		);

		ImportReportMail mail = composer.compose(job, log);

		assertTrue(mail.subject().contains("SUCCESS"));
		assertTrue(mail.subject().contains(jobId.toString()));
		assertTrue(mail.textBody().contains("Mitglieder"));
		assertTrue(mail.textBody().contains("Angelegt:      1"));
		assertTrue(mail.textBody().contains("Import job started"));
		assertTrue(mail.htmlBody().contains("Kennzahlen"));
		assertTrue(mail.htmlBody().contains("Mitglieder angelegt"));
		assertTrue(mail.htmlBody().contains("Protokoll (2 Einträge)"));
		assertTrue(mail.htmlBody().contains("Import job started"));
		assertTrue(mail.htmlBody().contains("SUCCESS"));
	}

	@Test
	void escapesHtmlInLogMessages() {
		ImporterConfig config = mock(ImporterConfig.class);
		ImporterConfig.MailConfig mailConfig = mock(ImporterConfig.MailConfig.class);
		when(config.mail()).thenReturn(mailConfig);
		when(mailConfig.subjectPrefix()).thenReturn("[HZD Import]");

		ImportReportComposer composer = new ImportReportComposer();
		setConfig(composer, config);

		UUID jobId = UUID.randomUUID();
		Instant now = Instant.now();
		ImportJob job = new ImportJob(
			jobId,
			ImportJobStatus.FAILED,
			now,
			now,
			"broken <script>",
			ImportStatistics.empty()
		);
		ImportJobLog log = new ImportJobLog(
			jobId,
			now,
			List.of(new ImportJobLogEntry(now, ImportJobLogLevel.ERROR, "row <b>1</b>"))
		);

		ImportReportMail mail = composer.compose(job, log);
		assertTrue(mail.htmlBody().contains("broken &lt;script&gt;"));
		assertTrue(mail.htmlBody().contains("row &lt;b&gt;1&lt;/b&gt;"));
		assertTrue(mail.htmlBody().contains("FAILED"));
	}

	private static void setConfig(ImportReportComposer composer, ImporterConfig config) {
		try {
			var field = ImportReportComposer.class.getDeclaredField("config");
			field.setAccessible(true);
			field.set(composer, config);
		} catch (ReflectiveOperationException exception) {
			throw new IllegalStateException(exception);
		}
	}
}
