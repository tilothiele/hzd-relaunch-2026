package de.hzd.importer.domain;

public record ImportReportMail(
		String subject,
		String textBody,
		String htmlBody
) {
}
