package de.hzd.importer.adapter.mail;

import de.hzd.importer.application.ImportReportComposer;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportReportMail;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import de.hzd.importer.port.ImportReportMailPort;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Arrays;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class SmtpImportReportMailAdapter implements ImportReportMailPort {

	private static final Logger LOG = Logger.getLogger(SmtpImportReportMailAdapter.class);

	@Inject
	ImporterConfig config;

	@Inject
	ImportReportComposer composer;

	@Inject
	Mailer mailer;

	@Override
	public void send(ImportJob job, ImportJobLog log) {
		ImporterConfig.MailConfig mailConfig = config.mail();
		if (!mailConfig.enabled()) {
			LOG.info("Import report mail skipped: importer.mail.enabled=false");
			return;
		}

		List<String> recipients = recipients(mailConfig);
		if (recipients.isEmpty()) {
			LOG.warn("Import report mail skipped: no recipients configured");
			return;
		}

		ImportReportMail report = composer.compose(job, log);
		Mail message = Mail.withHtml(recipients.getFirst(), report.subject(), report.htmlBody())
			.setText(report.textBody());
		mailConfig.from()
			.map(String::trim)
			.filter(value -> !value.isBlank())
			.ifPresent(message::setFrom);
		for (int index = 1; index < recipients.size(); index++) {
			message.addTo(recipients.get(index));
		}

		mailer.send(message);
		LOG.infof(
			"Import report mail sent for job %s to %s",
			job.id(),
			String.join(", ", recipients)
		);
	}

	private static List<String> recipients(ImporterConfig.MailConfig mailConfig) {
		return mailConfig.to()
			.stream()
			.flatMap(value -> Arrays.stream(value.split(",")))
			.map(String::trim)
			.filter(value -> !value.isBlank())
			.toList();
	}
}
