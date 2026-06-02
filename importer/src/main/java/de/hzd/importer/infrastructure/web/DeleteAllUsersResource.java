package de.hzd.importer.infrastructure.web;

import de.hzd.importer.application.AuthentikUserAdminService;
import de.hzd.importer.domain.DeleteAllUsersJob;
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

@Path("/delete-all-users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DeleteAllUsersResource {

	@Inject
	AuthentikUserAdminService authentikUserAdminService;

	@POST
	public Response deleteAllUsers() {
		Optional<UUID> jobId = authentikUserAdminService.startDeleteAllUsersAsync();
		if (jobId.isEmpty()) {
			return Response.status(Response.Status.CONFLICT)
				.entity(new ErrorResponse("Another job is already running"))
				.build();
		}
		return Response.accepted(new StartDeleteAllUsersResponse(jobId.get())).build();
	}

	@GET
	@Path("/{jobId}")
	public Response getJob(@PathParam("jobId") UUID jobId) {
		Optional<DeleteAllUsersJob> job = authentikUserAdminService.getJob(jobId);
		return job.map(value -> Response.ok(DeleteAllUsersJobResponse.from(value)).build())
			.orElseGet(() -> Response.status(Response.Status.NOT_FOUND)
				.entity(new ErrorResponse("Delete-all-users job not found"))
				.build());
	}

	public record StartDeleteAllUsersResponse(UUID jobId) {
	}

	public record ErrorResponse(String message) {
	}
}
