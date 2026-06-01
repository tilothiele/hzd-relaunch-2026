package de.hzd.importer.infrastructure.web;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter;
import de.hzd.importer.adapter.persistence.JobExecutionGuard;
import de.hzd.importer.port.MemberSyncPort;
import de.hzd.importer.support.QuarkusIntegrationTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CrossJobConcurrencyTest extends QuarkusIntegrationTest {

	@InjectMock
	MemberSyncPort memberSyncPort;

	@InjectMock
	AuthentikUserAdapter authentikUserAdapter;

	@Inject
	JobExecutionGuard jobExecutionGuard;

	@BeforeEach
	void setUp() {
		jobExecutionGuard.failAllRunningJobs();
		when(memberSyncPort.syncInStrapi(any())).thenAnswer(invocation -> {
			Thread.sleep(2500);
			return MemberSyncPort.SyncResult.CREATED;
		});
		when(authentikUserAdapter.deleteAllUsers()).thenAnswer(invocation -> {
			Thread.sleep(2500);
			return new AuthentikUserAdapter.DeleteAllUsersResult(0, 0);
		});
	}

	@Test
	void rejectsImportWhileDeleteAllUsersIsRunning() {
		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/delete-all-users")
			.then()
			.statusCode(202);

		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/import")
			.then()
			.statusCode(409)
			.body("message", equalTo("Another import job is already running"));
	}

	@Test
	void rejectsDeleteAllUsersWhileImportIsRunning() {
		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/import")
			.then()
			.statusCode(202);

		given()
			.contentType(ContentType.JSON)
			.when()
			.post("/delete-all-users")
			.then()
			.statusCode(409)
			.body("message", equalTo("Another job is already running"));
	}
}
