package de.hzd.importer.infrastructure.web;

import de.hzd.importer.application.ImportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Map;

@Path("/api/import/job")
@Produces(MediaType.APPLICATION_JSON)
public class JobResource {

    private static final Logger LOG = Logger.getLogger(JobResource.class);

    @Inject
    ImportService importService;

    @GET
    @Path("/start")
    public Response startImport() {
        LOG.info("Received request to start import job");

        if (importService.isRunning()) {
            LOG.info("Import job already running");
            return Response.ok(Map.of("status", "running")).build();
        }

        boolean started = importService.startImportIfNotRunning();

        if (started) {
            LOG.info("Import job started");
            return Response.ok(Map.of("status", "started")).build();
        } else {
            LOG.info("Import job could not be started (already running)");
            return Response.ok(Map.of("status", "running")).build();
        }
    }

    @GET
    @Path("/status")
    public Response getImportStatus() {
        String status = importService.isRunning() ? "running" : "idle";
        return Response.ok(Map.of("status", status)).build();
    }

    @GET
    @Path("/start-strapi-users")
    public Response startImportStrapiUsers() {
        LOG.info("Received request to start Strapi users import");

        LOG.info("Starting Strapi users import...");
        new Thread(() -> {
            try {
                importService.importStrapiUser();
            } catch (Exception e) {
                LOG.error("Strapi users import failed", e);
            }
        }).start();

        return Response.ok(Map.of("status", "started")).build();
    }
}
