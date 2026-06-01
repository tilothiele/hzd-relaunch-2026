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

@Path("/import")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ImportResource {

	@Inject
	ImportService importService;

	@POST
	public Response startImport() {
		Optional<UUID> jobId = importService.startImportAsync();
		if (jobId.isEmpty()) {
			return Response.status(Response.Status.CONFLICT)
				.entity(new ErrorResponse("Another import job is already running"))
				.build();
		}
		return Response.accepted(new StartImportResponse(jobId.get())).build();
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

	public record ErrorResponse(String message) {
	}
}
