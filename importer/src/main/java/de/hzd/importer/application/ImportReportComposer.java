package de.hzd.importer.application;

import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobLogEntry;
import de.hzd.importer.domain.ImportJobLogLevel;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportReportMail;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import de.hzd.util.DateHelper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@ApplicationScoped
public class ImportReportComposer {

	private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
	private static final DateTimeFormatter DATE_TIME =
		DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss").withZone(BERLIN);

	@Inject
	ImporterConfig config;

	public ImportReportMail compose(ImportJob job, ImportJobLog log) {
		String prefix = config.mail().subjectPrefix();
		String subject = prefix + " " + job.status() + " " + job.id();
		return new ImportReportMail(subject, composeText(job, log), composeHtml(job, log));
	}

	public String composeText(ImportJob job, ImportJobLog log) {
		ImportStatistics stats = job.statistics();
		StringBuilder text = new StringBuilder();
		text.append("HZD Import-Bericht\n");
		text.append("==================\n\n");
		text.append("Status:     ").append(job.status()).append('\n');
		text.append("Job-ID:     ").append(job.id()).append('\n');
		text.append("Start:      ").append(formatInstant(job.startedAt())).append('\n');
		text.append("Ende:       ").append(formatInstant(job.finishedAt())).append('\n');
		text.append("Dauer:      ").append(formatDuration(job)).append('\n');
		if (job.message() != null && !job.message().isBlank()) {
			text.append("Meldung:    ").append(job.message()).append('\n');
		}
		text.append('\n');
		text.append("Mitglieder\n");
		text.append("  Angelegt:      ").append(stats.membersCreated()).append('\n');
		text.append("  Aktualisiert:  ").append(stats.membersUpdated()).append('\n');
		text.append("  Übersprungen:  ").append(stats.membersSkipped()).append('\n');
		text.append("  Fehlgeschlagen:").append(stats.membersFailed()).append('\n');
		text.append('\n');
		text.append("Hunde\n");
		text.append("  Angelegt:      ").append(stats.dogsCreated()).append('\n');
		text.append("  Aktualisiert:  ").append(stats.dogsUpdated()).append('\n');
		text.append("  Fehlgeschlagen:").append(stats.dogsFailed()).append('\n');
		text.append('\n');
		text.append("Züchter\n");
		text.append("  Angelegt:      ").append(stats.breedersCreated()).append('\n');
		text.append('\n');
		text.append("Protokoll (").append(log.size()).append(" Einträge)\n");
		text.append("----------\n");
		for (ImportJobLogEntry entry : log.entries()) {
			text.append(formatInstant(entry.timestamp()))
				.append("  ")
				.append(entry.level())
				.append("  ")
				.append(entry.message())
				.append('\n');
		}
		return text.toString();
	}

	private String composeHtml(ImportJob job, ImportJobLog log) {
		ImportStatistics stats = job.statistics();
		boolean failed = job.status() == ImportJobStatus.FAILED;
		String statusColor = failed ? "#b42318" : "#027a48";
		String statusBackground = failed ? "#fef3f2" : "#ecfdf3";
		StringBuilder html = new StringBuilder();
		html.append("<!DOCTYPE html><html><head><meta charset=\"utf-8\">")
			.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
			.append("</head><body style=\"margin:0;padding:0;background:#f3f4f6;")
			.append("font-family:Arial,Helvetica,sans-serif;color:#111827;\">")
			.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"")
			.append(" style=\"background:#f3f4f6;padding:24px 0;\">")
			.append("<tr><td align=\"center\">")
			.append("<table role=\"presentation\" width=\"680\" cellpadding=\"0\" cellspacing=\"0\"")
			.append(" style=\"max-width:680px;width:100%;background:#ffffff;border-radius:12px;")
			.append("overflow:hidden;border:1px solid #e5e7eb;\">")
			.append("<tr><td style=\"padding:24px 28px;background:#111827;color:#ffffff;\">")
			.append("<div style=\"font-size:13px;letter-spacing:0.08em;text-transform:uppercase;")
			.append("opacity:0.72;\">HZD Importer</div>")
			.append("<div style=\"font-size:24px;font-weight:700;margin-top:6px;\">Import-Bericht</div>")
			.append("</td></tr>")
			.append("<tr><td style=\"padding:24px 28px;\">")
			.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">")
			.append("<tr><td style=\"padding:12px 16px;border-radius:8px;background:")
			.append(statusBackground)
			.append(";color:")
			.append(statusColor)
			.append(";font-weight:700;font-size:16px;\">")
			.append(escape(job.status().name()))
			.append("</td></tr></table>")
			.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"")
			.append(" style=\"margin-top:16px;font-size:14px;color:#374151;\">")
			.append(metaRow("Job-ID", job.id().toString()))
			.append(metaRow("Start", formatInstant(job.startedAt())))
			.append(metaRow("Ende", formatInstant(job.finishedAt())))
			.append(metaRow("Dauer", formatDuration(job)));
		if (job.message() != null && !job.message().isBlank()) {
			html.append(metaRow("Meldung", job.message()));
		}
		html.append("</table>")
			.append("<h2 style=\"margin:28px 0 12px;font-size:16px;\">Kennzahlen</h2>")
			.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"8\">")
			.append("<tr>")
			.append(kpiCard("Mitglieder angelegt", stats.membersCreated(), false))
			.append(kpiCard("Mitglieder aktualisiert", stats.membersUpdated(), false))
			.append(kpiCard("Mitglieder übersprungen", stats.membersSkipped(), false))
			.append("</tr><tr>")
			.append(kpiCard("Mitglieder fehlgeschlagen", stats.membersFailed(), stats.membersFailed() > 0))
			.append(kpiCard("Hunde angelegt", stats.dogsCreated(), false))
			.append(kpiCard("Hunde aktualisiert", stats.dogsUpdated(), false))
			.append("</tr><tr>")
			.append(kpiCard("Hunde fehlgeschlagen", stats.dogsFailed(), stats.dogsFailed() > 0))
			.append(kpiCard("Züchter angelegt", stats.breedersCreated(), false))
			.append("<td></td>")
			.append("</tr></table>")
			.append("<h2 style=\"margin:28px 0 12px;font-size:16px;\">Protokoll (")
			.append(log.size())
			.append(" Einträge)</h2>")
			.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"")
			.append(" style=\"border:1px solid #e5e7eb;border-radius:8px;font-size:12px;")
			.append("font-family:Consolas,Menlo,monospace;\">");
		if (log.entries().isEmpty()) {
			html.append("<tr><td style=\"padding:12px 14px;color:#6b7280;\">Keine Logeinträge</td></tr>");
		} else {
			for (ImportJobLogEntry entry : log.entries()) {
				html.append("<tr>")
					.append("<td style=\"padding:8px 10px;white-space:nowrap;color:#6b7280;")
					.append("border-bottom:1px solid #f3f4f6;width:140px;vertical-align:top;\">")
					.append(escape(formatInstant(entry.timestamp())))
					.append("</td>")
					.append("<td style=\"padding:8px 10px;white-space:nowrap;font-weight:700;")
					.append("border-bottom:1px solid #f3f4f6;width:56px;vertical-align:top;color:")
					.append(levelColor(entry.level()))
					.append(";\">")
					.append(escape(entry.level().name()))
					.append("</td>")
					.append("<td style=\"padding:8px 10px;border-bottom:1px solid #f3f4f6;")
					.append("word-break:break-word;\">")
					.append(escape(entry.message()))
					.append("</td></tr>");
			}
		}
		html.append("</table></td></tr></table></td></tr></table></body></html>");
		return html.toString();
	}

	private static String metaRow(String label, String value) {
		return "<tr><td style=\"padding:4px 0;width:120px;color:#6b7280;\">"
			+ escape(label)
			+ "</td><td style=\"padding:4px 0;font-weight:600;\">"
			+ escape(value)
			+ "</td></tr>";
	}

	private static String kpiCard(String label, int value, boolean alert) {
		String background = alert ? "#fef3f2" : "#f9fafb";
		String valueColor = alert ? "#b42318" : "#111827";
		return "<td width=\"33%\" style=\"background:"
			+ background
			+ ";border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;\">"
			+ "<div style=\"font-size:12px;color:#6b7280;\">"
			+ escape(label)
			+ "</div><div style=\"font-size:22px;font-weight:700;margin-top:4px;color:"
			+ valueColor
			+ ";\">"
			+ value
			+ "</div></td>";
	}

	private static String levelColor(ImportJobLogLevel level) {
		return switch (level) {
			case ERROR -> "#b42318";
			case WARN -> "#b54708";
			case INFO -> "#027a48";
		};
	}

	private static String formatInstant(Instant instant) {
		if (instant == null) {
			return "-";
		}
		return DATE_TIME.format(instant);
	}

	private static String formatDuration(ImportJob job) {
		if (job.startedAt() == null || job.finishedAt() == null) {
			return "-";
		}
		long millis = Duration.between(job.startedAt(), job.finishedAt()).toMillis();
		return DateHelper.formatDauer(Math.max(millis, 0));
	}

	private static String escape(String value) {
		if (value == null) {
			return "";
		}
		return value
			.replace("&", "&amp;")
			.replace("<", "&lt;")
			.replace(">", "&gt;")
			.replace("\"", "&quot;");
	}
}
