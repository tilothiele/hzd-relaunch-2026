package de.hzd.importer.adapter.file;

import de.hzd.importer.application.ImportReportComposer;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import de.hzd.importer.port.ImportJobLogArchivePort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ImportJobLogFileAdapter implements ImportJobLogArchivePort {

	private static final Logger LOG = Logger.getLogger(ImportJobLogFileAdapter.class);
	private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
	private static final DateTimeFormatter FILE_TIMESTAMP =
		DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(BERLIN);
	static final String FILE_PREFIX = "import-";
	static final String FILE_SUFFIX = ".log";

	@Inject
	ImporterConfig config;

	@Inject
	ImportReportComposer composer;

	@Override
	public void archive(ImportJob job, ImportJobLog log) {
		Path directory = Path.of(config.log().directory()).toAbsolutePath().normalize();
		try {
			Files.createDirectories(directory);
			Path file = resolveLogFile(directory, job);
			Files.writeString(file, composer.composeText(job, log), StandardCharsets.UTF_8);
			LOG.infof("Import job log written to %s", file);
			deleteExpiredLogs(directory, config.log().retentionDays());
		} catch (IOException exception) {
			throw new IllegalStateException(
				"Failed to write import job log to " + directory,
				exception
			);
		}
	}

	Path resolveLogFile(Path directory, ImportJob job) {
		Instant timestamp = job.finishedAt() != null ? job.finishedAt() : Instant.now();
		Path file = directory.resolve(FILE_PREFIX + FILE_TIMESTAMP.format(timestamp) + FILE_SUFFIX);
		if (Files.exists(file)) {
			String shortId = job.id().toString().substring(0, 8);
			file = directory.resolve(
				FILE_PREFIX + FILE_TIMESTAMP.format(timestamp) + "-" + shortId + FILE_SUFFIX
			);
		}
		return file;
	}

	void deleteExpiredLogs(Path directory, int retentionDays) throws IOException {
		if (retentionDays < 1 || !Files.isDirectory(directory)) {
			return;
		}
		Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
		try (DirectoryStream<Path> stream = Files.newDirectoryStream(directory, FILE_PREFIX + "*" + FILE_SUFFIX)) {
			for (Path file : stream) {
				if (!Files.isRegularFile(file)) {
					continue;
				}
				Instant modified = Files.getLastModifiedTime(file).toInstant();
				if (modified.isBefore(cutoff)) {
					Files.deleteIfExists(file);
					LOG.infof("Deleted expired import log %s", file);
				}
			}
		}
	}
}
