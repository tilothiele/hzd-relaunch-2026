package de.hzd.importer.infrastructure.web;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.when;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter;
import de.hzd.importer.adapter.persistence.JobExecutionGuard;
import de.hzd.importer.application.AuthentikUserAdminService;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.support.QuarkusIntegrationTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.time.Duration;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@QuarkusIntegrationTest
public class DeleteAllUsersResourceConcurrencyTest {

	@InjectMock
	AuthentikUserAdapter authentikUserAdapter;

	@Inject
	JobExecutionGuard jobExecutionGuard;

	@Inject
	AuthentikUserAdminService authentikUserAdminService;

	@BeforeEach
	void setUp() {
		jobExecutionGuard.failAllRunningJobs();
		when(authentikUserAdapter.deleteAllUsers()).thenAnswer(invocation -> {
			Thread.sleep(2500);
			return new AuthentikUserAdapter.DeleteAllUsersResult(0, 0);
		});
	}

	@Test
	void rejectsConcurrentDeleteAllUsersJob() {
		String jobId = given()
			.contentType(ContentType.JSON)
			.when()
			.post("/delete-all-users")
			.then()
			.statusCode(202)
			.extract()
			.path("jobId");

		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/delete-all-users")
			.then()
			.statusCode(409)
			.body("message", equalTo("Another job is already running"));

		Awaitility.await()
			.atMost(Duration.ofSeconds(30))
			.until(() -> authentikUserAdminService.getJob(java.util.UUID.fromString(jobId))
				.map(job -> job.status() != ImportJobStatus.RUNNING)
				.orElse(true));
	}
}
