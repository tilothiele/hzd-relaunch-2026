package de.hzd.importer.infrastructure.web;

import de.hzd.importer.application.ImportService;
import de.hzd.importer.domain.ImportJob;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Optional;
import java.util.UUID;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/import")
@Produces(MediaType.APPLICATION_JSON)
public class ImportResource {

	@Inject
	ImportService importService;

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	public Response startImport() {
		return startAccepted(importService.startImportAsync());
	}

	@POST
	@Path("/upload")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	public Response startImportFromUpload(
		@RestForm("members.csv") FileUpload members,
		@RestForm("dogs.csv") FileUpload dogs
	) {
		if (isMissingOrEmpty(members) || isMissingOrEmpty(dogs)) {
			return Response.status(Response.Status.BAD_REQUEST)
				.entity(new ErrorResponse("Both form files members.csv and dogs.csv are required"))
				.build();
		}
		return startAccepted(
			importService.startImportFromUpload(members.uploadedFile(), dogs.uploadedFile())
		);
	}

	@GET
	@Path("/{jobId}")
	public Response getJob(@PathParam("jobId") UUID jobId) {
		Optional<ImportJob> job = importService.getJob(jobId);
		return job.map(value -> Response.ok(ImportJobResponse.from(value)).build())
			.orElseGet(() -> Response.status(Response.Status.NOT_FOUND)
				.entity(new ErrorResponse("Import job not found"))
				.build());
	}

	private Response startAccepted(Optional<UUID> jobId) {
		if (jobId.isEmpty()) {
			return Response.status(Response.Status.CONFLICT)
				.entity(new ErrorResponse("Another import job is already running"))
				.build();
		}
		return Response.accepted(new StartImportResponse(jobId.get())).build();
	}

	private static boolean isMissingOrEmpty(FileUpload upload) {
		return upload == null || upload.size() <= 0 || upload.uploadedFile() == null;
	}

	public record ErrorResponse(String message) {
	}
}
