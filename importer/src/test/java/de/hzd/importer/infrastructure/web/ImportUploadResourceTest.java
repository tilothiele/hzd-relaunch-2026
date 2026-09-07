package de.hzd.importer.infrastructure.web;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.hzd.importer.application.ImportService;
import de.hzd.importer.support.QuarkusIntegrationTest;
import io.quarkus.test.InjectMock;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusIntegrationTest
public class ImportUploadResourceTest {

	@InjectMock
	ImportService importService;

	@Test
	void startsJobFromUploadedCsvFiles() {
		UUID jobId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
		when(importService.startImportFromUpload(any(), any())).thenReturn(Optional.of(jobId));

		given()
			.multiPart("members.csv", "members.csv", "id,name\n1,Lena".getBytes(), "text/csv")
			.multiPart("dogs.csv", "dogs.csv", "id,name\n1,Bo".getBytes(), "text/csv")
			.when()
			.post("/import/upload")
			.then()
			.statusCode(202)
			.body("jobId", equalTo(jobId.toString()));

		verify(importService).startImportFromUpload(any(Path.class), any(Path.class));
	}

	@Test
	void rejectsMissingDogsFile() {
		given()
			.multiPart("members.csv", "members.csv", "id,name\n1,Lena".getBytes(), "text/csv")
			.when()
			.post("/import/upload")
			.then()
			.statusCode(400)
			.body("message", equalTo("Both form files members.csv and dogs.csv are required"));
	}

	@Test
	void rejectsWhenAnotherJobIsRunning() {
		when(importService.startImportFromUpload(any(), any())).thenReturn(Optional.empty());

		given()
			.multiPart("members.csv", "members.csv", "id,name\n1,Lena".getBytes(), "text/csv")
			.multiPart("dogs.csv", "dogs.csv", "id,name\n1,Bo".getBytes(), "text/csv")
			.when()
			.post("/import/upload")
			.then()
			.statusCode(409)
			.body("message", equalTo("Another import job is already running"));
	}
}
