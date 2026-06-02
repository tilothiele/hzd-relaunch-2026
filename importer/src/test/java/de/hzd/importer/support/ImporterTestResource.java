package de.hzd.importer.support;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

public class ImporterTestResource implements QuarkusTestResourceLifecycleManager {

	private static final DockerImageName POSTGRES_IMAGE =
		DockerImageName.parse("postgres:16-alpine");

	private static final DockerImageName WIREMOCK_IMAGE =
		DockerImageName.parse("wiremock/wiremock:3.9.1");

	private PostgreSQLContainer<?> postgres;
	private GenericContainer<?> wireMock;

	@Override
	public void init(Map<String, String> initArgs) {
		System.setProperty("quarkus.jacoco.enabled", "false");
		System.setProperty("quarkus.jacoco.report", "false");
	}

	@Override
	public Map<String, String> start() {
		postgres = new PostgreSQLContainer<>(POSTGRES_IMAGE)
			.withDatabaseName("importer_test")
			.withUsername("importer")
			.withPassword("importer");
		postgres.start();

		wireMock = new GenericContainer<>(WIREMOCK_IMAGE)
			.withExposedPorts(8080)
			.withCopyToContainer(
				MountableFile.forClasspathResource("wiremock/"),
				"/home/wiremock"
			);
		wireMock.start();

		String wireMockBaseUrl = "http://%s:%d".formatted(
			wireMock.getHost(),
			wireMock.getMappedPort(8080)
		);

		Map<String, String> config = new HashMap<>();
		config.put("quarkus.datasource.db-kind", "postgresql");
		config.put("quarkus.datasource.username", postgres.getUsername());
		config.put("quarkus.datasource.password", postgres.getPassword());
		config.put("quarkus.datasource.jdbc.url", postgres.getJdbcUrl());
		config.put("quarkus.hibernate-orm.database.generation", "none");
		config.put("quarkus.flyway.migrate-at-start", "true");
		config.put("quarkus.flyway.baseline-on-migrate", "true");
		config.put("quarkus.flyway.baseline-version", "1");
		config.put("quarkus.jacoco.enabled", "false");
		config.put("quarkus.jacoco.report", "false");
		config.put("importer.strapi.base-url", wireMockBaseUrl + "/api");
		config.put("importer.strapi.api-token", "test-token");
		config.put("importer.authentik.base-url", wireMockBaseUrl);
		config.put("importer.authentik.api-token", "test-token");
		config.put("importer.authentik.default-groups", "hzd-member");
		config.put("quarkus.rest-client.strapi-api.url", wireMockBaseUrl + "/api");
		config.put("quarkus.rest-client.authentik-api.url", wireMockBaseUrl);
		config.put(
			"importer.csv.members-path",
			resolveTestCsv("members.csv")
		);
		config.put(
			"importer.csv.dogs-path",
			resolveTestCsv("dogs.csv")
		);
		return config;
	}

	private static String resolveTestCsv(String fileName) {
		Path moduleRelative = Path.of("src/test/resources", fileName).toAbsolutePath().normalize();
		if (Files.exists(moduleRelative)) {
			return moduleRelative.toString();
		}

		try (InputStream inputStream = Thread.currentThread()
			.getContextClassLoader()
			.getResourceAsStream(fileName)) {
			if (inputStream == null) {
				throw new IllegalStateException("Test CSV not found: " + fileName);
			}

			Path tempFile = Files.createTempFile("importer-test-", "-" + fileName);
			tempFile.toFile().deleteOnExit();
			Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
			return tempFile.toString();
		} catch (IOException exception) {
			throw new IllegalStateException("Failed to resolve test CSV: " + fileName, exception);
		}
	}

	@Override
	public void stop() {
		if (wireMock != null) {
			wireMock.stop();
		}
		if (postgres != null) {
			postgres.stop();
		}
	}
}
