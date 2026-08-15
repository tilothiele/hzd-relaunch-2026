package de.hzd.importer.infrastructure.web;

import de.hzd.importer.application.ImportService;
import de.hzd.importer.domain.BreederCache;
import de.hzd.importer.domain.DogCache;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.domain.StrapiUserCache;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.HashMap;
import java.util.Map;

@Path("/api/import")
@Produces(MediaType.APPLICATION_JSON)
public class ImportResource {

    private static final Logger LOG = Logger.getLogger(ImportResource.class);

    @Inject
    ImportService importService;

    @Inject
    StrapiUserCache userCache;

    @Inject
    DogCache dogCache;

    @Inject
    BreederCache breederCache;

    @POST
    public Response startImport() {
        LOG.info("Starting Strapi import (synchronous)");

        importService.importAll();

        return Response.ok(getImportStatus()).build();
    }

    @GET
    @Path("/status")
    public Response getImportStatusResponse() {
        return Response.ok(getImportStatus()).build();
    }

    @GET
    @Path("/members")
    public Response getMembers(@QueryParam("limit") Integer limit) {
        var users = userCache.getAll();
        int size = users.size();

        if (limit != null && limit > 0 && limit < size) {
            users = users.subList(0, limit);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", size);
        result.put("users", users);

        return Response.ok(result).build();
    }

    @GET
    @Path("/dogs")
    public Response getDogs(@QueryParam("limit") Integer limit) {
        var dogs = dogCache.getAll();
        int size = dogs.size();

        if (limit != null && limit > 0 && limit < size) {
            dogs = dogs.subList(0, limit);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", size);
        result.put("dogs", dogs);

        return Response.ok(result).build();
    }

    @GET
    @Path("/breeders")
    public Response getBreeders(@QueryParam("limit") Integer limit) {
        var breeders = breederCache.getAll();
        int size = breeders.size();

        if (limit != null && limit > 0 && limit < size) {
            breeders = breeders.subList(0, limit);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", size);
        result.put("breeders", breeders);

        return Response.ok(result).build();
    }

    private Map<String, Object> getImportStatus() {
        Map<String, Object> status = new HashMap<>();

        ImportStatistics stats = importService.getStatistics();
        status.put("statistics", stats);

        return status;
    }
}
