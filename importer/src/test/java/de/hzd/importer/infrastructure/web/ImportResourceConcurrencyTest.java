package de.hzd.importer.infrastructure.web;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import de.hzd.importer.adapter.persistence.ImportJobRepository;
import de.hzd.importer.application.ImportService;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.port.MemberSyncPort;
import de.hzd.importer.support.QuarkusIntegrationTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.time.Duration;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ImportResourceConcurrencyTest extends QuarkusIntegrationTest {

	@InjectMock
	MemberSyncPort memberSyncPort;

	@Inject
	ImportJobRepository jobRepository;

	@Inject
	ImportService importService;

	@BeforeEach
	void setUp() {
		jobRepository.failRunningJobs();
		when(memberSyncPort.syncInStrapi(any())).thenAnswer(invocation -> {
			Thread.sleep(2500);
			return MemberSyncPort.SyncResult.CREATED;
		});
	}

	@Test
	void rejectsConcurrentImport() {
		String jobId = given()
			.contentType(ContentType.JSON)
			.when()
			.post("/import")
			.then()
			.statusCode(202)
			.extract()
			.path("jobId");

		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/import")
			.then()
			.statusCode(409)
			.body("message", equalTo("Another import job is already running"));

		Awaitility.await()
			.atMost(Duration.ofSeconds(30))
			.until(() -> importService.getJob(java.util.UUID.fromString(jobId))
				.map(job -> job.status() != ImportJobStatus.RUNNING)
				.orElse(true));
	}
}
