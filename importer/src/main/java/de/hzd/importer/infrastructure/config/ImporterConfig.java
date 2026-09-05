package de.hzd.importer.infrastructure.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;
import java.time.Duration;
import java.util.Optional;

@ConfigMapping(prefix = "importer")
public interface ImporterConfig {

	CsvConfig csv();

	SchedulerConfig scheduler();

	StrapiConfig strapi();

	MailConfig mail();

	LogConfig log();

	RetryConfig retry();

	interface CsvConfig {
		@WithDefault("members.csv")
		String membersPath();

		@WithDefault("dogs.csv")
		String dogsPath();
	}

	interface SchedulerConfig {
		@WithDefault("false")
		boolean enabled();

		@WithDefault("0 0 2 * * ?")
		String cron();
	}

	interface StrapiConfig {
		@WithDefault("http://localhost:1337/api")
		String baseUrl();

		Optional<String> apiToken();

		@WithDefault("30s")
		Duration httpTimeout();

		@WithDefault("100")
		int pageSize();

		@WithDefault("3")
		int maxRetries();

		@WithDefault("100ms")
		Duration requestDelay();

		@WithDefault("Startstart")
		String defaultPassword();

		Optional<Integer> authenticatedRoleId();
	}

	interface MailConfig {
		@WithDefault("false")
		boolean enabled();

		Optional<String> from();

		Optional<String> to();

		@WithDefault("[HZD Import]")
		String subjectPrefix();
	}

	interface LogConfig {
		@WithDefault("logs")
		String directory();

		@WithDefault("7")
		int retentionDays();
	}

	interface RetryConfig {
		@WithDefault("1s")
		Duration initialDelay();

		@WithDefault("30s")
		Duration maxDelay();
	}
}
