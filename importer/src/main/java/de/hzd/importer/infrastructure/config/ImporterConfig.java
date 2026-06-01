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

	AuthentikConfig authentik();

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

	interface AuthentikConfig {
		String baseUrl();

		Optional<String> apiToken();

		@WithDefault("30s")
		Duration httpTimeout();

		@WithDefault("100")
		int pageSize();
	}

	interface RetryConfig {
		@WithDefault("1s")
		Duration initialDelay();

		@WithDefault("30s")
		Duration maxDelay();
	}
}
