package de.hzd.importer.infrastructure.web;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.adapter.persistence.ImportJobRepository;
import de.hzd.importer.application.ImportService;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.support.QuarkusIntegrationTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.UUID;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ImportResourceIntegrationTest extends QuarkusIntegrationTest {

	@Inject
	ImportService importService;

	@Inject
	ImportJobRepository jobRepository;

	@BeforeEach
	void cleanUpJobs() {
		jobRepository.failRunningJobs();
	}

	@Test
	void startImportReturnsJobId() {
		String jobId = given()
			.contentType(ContentType.JSON)
			.when()
			.post("/import")
			.then()
			.statusCode(202)
			.body("jobId", notNullValue())
			.extract()
			.path("jobId");

		Awaitility.await()
			.atMost(Duration.ofSeconds(30))
			.untilAsserted(() -> {
				ImportJobStatus status = importService.getJob(UUID.fromString(jobId))
					.orElseThrow()
					.status();
				assertTrue(
					status == ImportJobStatus.SUCCESS || status == ImportJobStatus.FAILED,
					"Expected terminal status but was " + status
				);
			});

		var job = importService.getJob(UUID.fromString(jobId)).orElseThrow();
		assertEquals(ImportJobStatus.SUCCESS, job.status());
		assertEquals(1, job.statistics().membersCreated());
		assertEquals(1, job.statistics().dogsCreated());
		assertEquals(1, job.statistics().breedersCreated());
	}
}
