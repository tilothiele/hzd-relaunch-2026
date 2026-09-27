package de.hzd.importer.application;

import de.hzd.importer.application.CsvSnapshotDiffer.Action;
import de.hzd.importer.application.CsvSnapshotDiffer.Field;
import de.hzd.importer.application.CsvSnapshotDiffer.Result;
import de.hzd.importer.application.CsvSnapshotDiffer.Row;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.infrastructure.config.ImporterConfig;
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
import java.util.UUID;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ImportHtmlReportWriter {

	private static final Logger LOG = Logger.getLogger(ImportHtmlReportWriter.class);
	private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
	private static final DateTimeFormatter FILE_TIMESTAMP =
		DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(BERLIN);
	static final String FILE_PREFIX = "import-";
	static final String FILE_SUFFIX = ".html";

	@Inject
	ImporterConfig config;

	public Path write(UUID jobId, ImportJob job, Result members, Result dogs) {
		Path directory = Path.of(config.log().directory()).toAbsolutePath().normalize();
		try {
			Path file = writeTo(directory, jobId, job, members, dogs, config.log().retentionDays());
			LOG.infof("Import HTML report written to %s", file);
			return file;
		} catch (IOException exception) {
			throw new IllegalStateException(
				"Failed to write import HTML report to " + directory,
				exception
			);
		}
	}

	Path writeTo(
		Path directory,
		UUID jobId,
		ImportJob job,
		Result members,
		Result dogs,
		int retentionDays
	) throws IOException {
		Files.createDirectories(directory);
		Path file = resolveReportFile(directory, jobId, job);
		Files.writeString(file, render(jobId, job, members, dogs), StandardCharsets.UTF_8);
		deleteExpiredReports(directory, retentionDays);
		return file;
	}

	public String render(UUID jobId, ImportJob job, Result members, Result dogs) {
		StringBuilder html = new StringBuilder();
		html.append("<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n");
		html.append("<meta charset=\"utf-8\">\n");
		html.append("<title>HZD Import-Report</title>\n");
		html.append("<style>\n");
		html.append("body{font-family:sans-serif;margin:24px;color:#222;}\n");
		html.append("h1{font-size:1.4rem;} h2{margin-top:2rem;font-size:1.1rem;}\n");
		html.append(".wrap{overflow-x:auto;}\n");
		html.append("table{border-collapse:collapse;}\n");
		html.append("th,td{border:1px solid #ccc;padding:4px 8px;vertical-align:top;white-space:nowrap;}\n");
		html.append("th{background:#f4f4f4;text-align:left;}\n");
		html.append("tr.inserted td{background:#ffd43b;}\n");
		html.append("td.diff{background:#ff6b6b;color:#3b0a0a;font-weight:600;}\n");
		html.append(".meta{color:#444;}\n");
		html.append("</style>\n</head>\n<body>\n");
		html.append("<h1>HZD Import-Report</h1>\n");
		html.append("<p class=\"meta\">Job ").append(escape(jobId.toString()));
		if (job != null) {
			html.append(" · ").append(escape(String.valueOf(job.status())));
			if (job.message() != null && !job.message().isBlank()) {
				html.append(" · ").append(escape(job.message()));
			}
		}
		html.append("</p>\n");
		html.append("<p class=\"meta\">Neue Datensätze sind gelb markiert. ");
		html.append("Geänderte Felder zeigen den bisherigen Datenbankwert und den CSV-Wert und sind rot markiert.</p>\n");
		appendSection(html, "Mitglieder", members);
		appendSection(html, "Hunde", dogs);
		html.append("</body>\n</html>\n");
		return html.toString();
	}

	private static void appendSection(StringBuilder html, String title, Result result) {
		html.append("<h2>").append(escape(title)).append("</h2>\n");
		if (result == null) {
			html.append("<p>Plausibilitätsprüfung übersprungen, die Tabelle war leer.</p>\n");
			return;
		}
		html.append("<p class=\"meta\">")
			.append(result.newCount()).append(" neu, ")
			.append(result.changedCount()).append(" mit Abweichungen, ")
			.append(result.removedCount()).append(" entfernt.</p>\n");
		if (result.rows().isEmpty()) {
			html.append("<p>Keine Einträge.</p>\n");
			return;
		}
		html.append("<div class=\"wrap\"><table>\n<thead><tr>");
		html.append("<th>cId</th><th>Bezeichnung</th><th>Aktion</th>");
		for (Field field : result.rows().get(0).fields()) {
			html.append("<th>").append(escape(field.name())).append("</th>");
		}
		html.append("</tr></thead>\n<tbody>\n");
		for (Row row : result.rows()) {
			html.append("<tr");
			if (row.action() == Action.NEW) {
				html.append(" class=\"inserted\"");
			}
			html.append(">");
			html.append("<td>").append(row.cId()).append("</td>");
			html.append("<td>").append(escape(row.label())).append("</td>");
			html.append("<td>").append(actionLabel(row.action())).append("</td>");
			for (Field field : row.fields()) {
				appendCell(html, row, field);
			}
			html.append("</tr>\n");
		}
		html.append("</tbody></table></div>\n");
	}

	private static void appendCell(StringBuilder html, Row row, Field field) {
		if (row.action() == Action.CHANGED && field.different()) {
			html.append("<td class=\"diff\">DB: ")
				.append(escape(display(field.previousValue())))
				.append("<br>CSV: ")
				.append(escape(display(field.csvValue())))
				.append("</td>");
			return;
		}
		String value = row.action() == Action.REMOVED ? field.previousValue() : field.csvValue();
		html.append("<td>").append(escape(value)).append("</td>");
	}

	private static String display(String value) {
		return value == null || value.isBlank() ? "(leer)" : value;
	}

	private static String actionLabel(Action action) {
		return switch (action) {
			case NEW -> "Neu";
			case CHANGED -> "Geändert";
			case UNCHANGED -> "Unverändert";
			case REMOVED -> "Entfernt";
		};
	}

	Path resolveReportFile(Path directory, UUID jobId, ImportJob job) {
		Instant timestamp = job != null && job.finishedAt() != null ? job.finishedAt() : Instant.now();
		String shortId = jobId.toString().substring(0, 8);
		return directory.resolve(FILE_PREFIX + FILE_TIMESTAMP.format(timestamp) + "-" + shortId + FILE_SUFFIX);
	}

	void deleteExpiredReports(Path directory, int retentionDays) throws IOException {
		if (retentionDays < 1 || !Files.isDirectory(directory)) {
			return;
		}
		Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
		try (DirectoryStream<Path> stream = Files.newDirectoryStream(
			directory,
			FILE_PREFIX + "*" + FILE_SUFFIX
		)) {
			for (Path file : stream) {
				if (!Files.isRegularFile(file)) {
					continue;
				}
				Instant modified = Files.getLastModifiedTime(file).toInstant();
				if (modified.isBefore(cutoff)) {
					Files.deleteIfExists(file);
					LOG.infof("Deleted expired import report %s", file);
				}
			}
		}
	}

	private static String escape(String value) {
		if (value == null || value.isEmpty()) {
			return "";
		}
		return value
			.replace("&", "&amp;")
			.replace("<", "&lt;")
			.replace(">", "&gt;")
			.replace("\"", "&quot;");
	}
}
