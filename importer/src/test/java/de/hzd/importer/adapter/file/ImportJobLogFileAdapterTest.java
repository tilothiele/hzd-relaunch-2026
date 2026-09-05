package de.hzd.importer.adapter.file;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import de.hzd.importer.application.ImportReportComposer;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ImportJobLogFileAdapterTest {

	@TempDir
	Path tempDir;

	@Test
	void writesTimestampedLogAndDeletesExpiredFiles() throws Exception {
		ImportJobLogFileAdapter adapter = adapter(tempDir.toString(), 7);
		Instant finishedAt = Instant.parse("2026-09-05T18:01:05Z");
		ImportJob job = new ImportJob(
			UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
			ImportJobStatus.SUCCESS,
			finishedAt.minusSeconds(65),
			finishedAt,
			"ok",
			ImportStatistics.empty()
		);

		Path expired = tempDir.resolve("import-20250101-000000.log");
		Path recent = tempDir.resolve("import-20260904-120000.log");
		Files.writeString(expired, "old");
		Files.writeString(recent, "recent");
		Files.setLastModifiedTime(expired, FileTime.from(Instant.now().minus(8, ChronoUnit.DAYS)));
		Files.setLastModifiedTime(recent, FileTime.from(Instant.now().minus(2, ChronoUnit.DAYS)));

		adapter.archive(job, ImportJobLog.empty(job.id()));

		Path written = tempDir.resolve("import-20260905-200105.log");
		assertTrue(Files.exists(written));
		assertEquals("bericht", Files.readString(written));
		assertFalse(Files.exists(expired));
		assertTrue(Files.exists(recent));
	}

	@Test
	void keepsAllFilesWhenRetentionIsDisabled() throws Exception {
		ImportJobLogFileAdapter adapter = adapter(tempDir.toString(), 0);
		Path expired = tempDir.resolve("import-20250101-000000.log");
		Files.writeString(expired, "old");
		Files.setLastModifiedTime(expired, FileTime.from(Instant.now().minus(30, ChronoUnit.DAYS)));

		adapter.deleteExpiredLogs(tempDir, 0);

		assertTrue(Files.exists(expired));
	}

	private static ImportJobLogFileAdapter adapter(String directory, int retentionDays) {
		ImporterConfig config = mock(ImporterConfig.class);
		ImporterConfig.LogConfig logConfig = mock(ImporterConfig.LogConfig.class);
		when(config.log()).thenReturn(logConfig);
		when(logConfig.directory()).thenReturn(directory);
		when(logConfig.retentionDays()).thenReturn(retentionDays);

		ImportReportComposer composer = mock(ImportReportComposer.class);
		when(composer.composeText(any(), any())).thenReturn("bericht");

		ImportJobLogFileAdapter adapter = new ImportJobLogFileAdapter();
		setField(adapter, "config", config);
		setField(adapter, "composer", composer);
		return adapter;
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
