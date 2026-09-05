package de.hzd.importer.adapter.mail;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.hzd.importer.application.ImportReportComposer;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobLog;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportReportMail;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class SmtpImportReportMailAdapterTest {

	@Test
	void skipsWhenDisabled() {
		Mailer mailer = mock(Mailer.class);
		SmtpImportReportMailAdapter adapter = adapter(false, Optional.of("ops@example.de"), mailer);

		adapter.send(job(), ImportJobLog.empty(UUID.randomUUID()));

		verify(mailer, never()).send(any(Mail.class));
	}

	@Test
	void skipsWhenNoRecipients() {
		Mailer mailer = mock(Mailer.class);
		SmtpImportReportMailAdapter adapter = adapter(true, Optional.empty(), mailer);

		adapter.send(job(), ImportJobLog.empty(UUID.randomUUID()));

		verify(mailer, never()).send(any(Mail.class));
	}

	@Test
	void sendsHtmlReportToConfiguredRecipients() {
		Mailer mailer = mock(Mailer.class);
		SmtpImportReportMailAdapter adapter = adapter(
			true,
			Optional.of("ops@example.de, board@example.de"),
			mailer
		);

		adapter.send(job(), ImportJobLog.empty(UUID.randomUUID()));

		ArgumentCaptor<Mail> captor = ArgumentCaptor.forClass(Mail.class);
		verify(mailer).send(captor.capture());
		Mail mail = captor.getValue();
		assertEquals("ops@example.de", mail.getTo().getFirst());
		assertTrue(mail.getTo().contains("board@example.de"));
		assertEquals("[HZD Import] SUCCESS test", mail.getSubject());
		assertEquals("<html>dashboard</html>", mail.getHtml());
		assertEquals("plain", mail.getText());
		assertEquals("importer@example.de", mail.getFrom());
	}

	private static SmtpImportReportMailAdapter adapter(
		boolean enabled,
		Optional<String> to,
		Mailer mailer
	) {
		ImporterConfig config = mock(ImporterConfig.class);
		ImporterConfig.MailConfig mailConfig = mock(ImporterConfig.MailConfig.class);
		when(config.mail()).thenReturn(mailConfig);
		when(mailConfig.enabled()).thenReturn(enabled);
		when(mailConfig.to()).thenReturn(to);
		when(mailConfig.from()).thenReturn(Optional.of("importer@example.de"));
		when(mailConfig.subjectPrefix()).thenReturn("[HZD Import]");

		ImportReportComposer composer = mock(ImportReportComposer.class);
		when(composer.compose(any(), any())).thenReturn(
			new ImportReportMail("[HZD Import] SUCCESS test", "plain", "<html>dashboard</html>")
		);

		SmtpImportReportMailAdapter adapter = new SmtpImportReportMailAdapter();
		setField(adapter, "config", config);
		setField(adapter, "composer", composer);
		setField(adapter, "mailer", mailer);
		return adapter;
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
