package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.hzd.importer.domain.Breeder;
import de.hzd.importer.domain.BreederCache;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogCache;
import de.hzd.importer.domain.StrapiUser;
import de.hzd.importer.domain.StrapiUserCache;
import de.hzd.util.Ticker;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.client.WebClientOptions;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiClient {

    private static final Logger LOG = Logger.getLogger(StrapiClient.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "importer.strapi.base-url", defaultValue = "http://localhost:1337/api")
    String strapiBaseUrl;

    @ConfigProperty(name = "importer.strapi.api-token")
    String apiToken;

    @ConfigProperty(name = "importer.strapi.page-size", defaultValue = "100")
    int pageSize;

    private WebClient webClient;

    private WebClient getClient() {
        if (webClient == null) {
            WebClientOptions options = new WebClientOptions()
                    .setConnectTimeout(5000)
                    .setIdleTimeout(60)
                    .setFollowRedirects(true);
            webClient = WebClient.create(vertx, options);
        }
        return webClient;
    }

    private JsonNode getDataNode(JsonNode root) {
        if (root.has("data")) {
            return root.get("data");
        }
        // Users endpoint returns array directly
        if (root.isArray()) {
            return root;
        }
        return null;
    }

    private JsonNode getPaginationNode(JsonNode root) {
        // Strapi v4 format
        if (root.has("pagination")) {
            return root.get("pagination");
        }
        // Strapi v5 format
        if (root.has("meta") && root.get("meta").has("pagination")) {
            return root.get("meta").get("pagination");
        }
        return null;
    }

    /**
     * Fetch all users and add directly to cache.
     * Note: Strapi /users returns array directly, not {data: []}
     * @return number of users fetched
     */
    public int fetchAllUsers(StrapiUserCache cache, Ticker ticker) throws Exception {
        int totalFetched = 0;

        String url = strapiBaseUrl + "/users?pagination%5BpageSize%5D=" + pageSize;
        String response = fetch(url);

        JsonNode root = objectMapper.readTree(response);

        LOG.info("[StrapiClient] User response length: " + response.length() + " bytes");
        LOG.info("[StrapiClient] User response sample: " + response.substring(0, Math.min(500, response.length())));

        JsonNode data;
        if (root.isArray()) {
            data = root;
            LOG.info("[StrapiClient] Users response is direct array with " + data.size() + " items");
        } else {
            data = getDataNode(root);
            if (data == null || !data.isArray()) {
                LOG.warn("[StrapiClient] No 'data' array in response");
                return 0;
            }
        }

        if (data.isEmpty()) {
            LOG.info("[StrapiClient] Empty data array");
            return 0;
        }

        LOG.info("[StrapiClient] Processing " + data.size() + " user items");

        for (JsonNode item : data) {
            StrapiUser user = MemberMapper.parseUser(item);
            if (user != null) {
                cache.add(user);
                totalFetched++;
                final Integer cId = user.getCId().orElse(null);
                ticker.tick(new Runnable() {
                    @Override
                    public void run() {
                        LOG.debug("Last parsed user cId=" + cId);
                    }
                });
            }
        }

        ticker.finish();
        LOG.info("[StrapiClient] Total users fetched: " + totalFetched);
        return totalFetched;
    }

    /**
     * Fetch all breeders and add directly to cache.
     * @return number of breeders fetched
     */
    public int fetchAllBreeders(BreederCache cache, Ticker ticker) throws Exception {
        int totalFetched = 0;
        int page = 1;
        int pageCount = 1;

        while (true) {
            String url = strapiBaseUrl + "/hzd-plugin/breeders?pagination%5Bpage%5D=" + page + "&pagination%5BpageSize%5D=" + pageSize;
            String response = fetch(url);

            JsonNode root = objectMapper.readTree(response);
            LOG.debug("[StrapiClient] Breeders response: " + response.substring(0, Math.min(800, response.length())));

            JsonNode pagination = getPaginationNode(root);
            if (pagination != null && pagination.has("pageCount")) {
                pageCount = pagination.get("pageCount").asInt();
                int total = pagination.has("total") ? pagination.get("total").asInt() : -1;
                LOG.info("[StrapiClient] Breeders page " + page + "/" + pageCount + " (total: " + total + ")");
            } else {
                LOG.warn("[StrapiClient] No pagination info - will fetch until empty");
                pageCount = page;
            }

            JsonNode data = getDataNode(root);
            if (data == null || !data.isArray()) {
                LOG.warn("[StrapiClient] No data array in breeders response");
                break;
            }

            if (data.isEmpty()) {
                LOG.info("[StrapiClient] Empty breeders data - stopping");
                break;
            }

            for (JsonNode item : data) {
                Breeder breeder = BreederMapper.parseBreeder(item);
                if (breeder != null) {
                    cache.add(breeder);
                    totalFetched++;
                    final Integer cId = breeder.getCId().orElse(null);
                    ticker.tick(new Runnable() {
                        @Override
                        public void run() {
                            LOG.debug("Last parsed breeder cId=" + cId);
                        }
                    });
                }
            }

            if (page >= pageCount) {
                break;
            }
            page++;
        }

        ticker.finish();
        LOG.info("[StrapiClient] Total breeders fetched: " + totalFetched);
        return totalFetched;
    }

    /**
     * Fetch all dogs and add directly to cache.
     * @return number of dogs fetched
     */
    public int fetchAllDogs(DogCache cache, Ticker ticker) throws Exception {
        int totalFetched = 0;
        int page = 1;
        int pageCount = 1;

        while (true) {
            String url = strapiBaseUrl + "/hzd-plugin/dogs?pagination%5Bpage%5D=" + page + "&pagination%5BpageSize%5D=" + pageSize;
            String response = fetch(url);

            JsonNode root = objectMapper.readTree(response);
            LOG.debug("[StrapiClient] Dogs response: " + response.substring(0, Math.min(800, response.length())));

            JsonNode pagination = getPaginationNode(root);
            if (pagination != null && pagination.has("pageCount")) {
                pageCount = pagination.get("pageCount").asInt();
                int total = pagination.has("total") ? pagination.get("total").asInt() : -1;
                LOG.info("[StrapiClient] Dogs page " + page + "/" + pageCount + " (total: " + total + ")");
            } else {
                LOG.warn("[StrapiClient] No pagination info - will fetch until empty");
                pageCount = page;
            }

            JsonNode data = getDataNode(root);
            if (data == null || !data.isArray()) {
                LOG.warn("[StrapiClient] No data array in dogs response");
                break;
            }

            if (data.isEmpty()) {
                LOG.info("[StrapiClient] Empty dogs data - stopping");
                break;
            }

            for (JsonNode item : data) {
                Dog dog = DogMapper.parseDog(item);
                if (dog != null) {
                    cache.add(dog);
                    totalFetched++;
                    final Integer cId = dog.getCId().orElse(null);
                    ticker.tick(new Runnable() {
                        @Override
                        public void run() {
                            LOG.debug("Last parsed dog cId=" + cId);
                        }
                    });
                }
            }

            if (page >= pageCount) {
                break;
            }
            page++;
        }

        ticker.finish();
        LOG.info("[StrapiClient] Total dogs fetched: " + totalFetched);
        return totalFetched;
    }

    public String fetchUserByCId(int cId) throws Exception {
        String url = strapiBaseUrl + "/users?filters%5BcId%5D%5B$eq%5D=" + cId + "&pagination%5BpageSize%5D=1";
        return fetch(url);
    }

    public String fetchBreederByCId(int cId) throws Exception {
        String url = strapiBaseUrl + "/hzd-plugin/breeders?filters%5BcId%5D%5B$eq%5D=" + cId + "&pagination%5BpageSize%5D=1";
        return fetch(url);
    }

    public String fetchDogsByOwnerCIds(java.util.List<Integer> ownerCIds) throws Exception {
        if (ownerCIds == null || ownerCIds.isEmpty()) {
            return "{\"data\":[]}";
        }
        StringBuilder filter = new StringBuilder();
        for (int i = 0; i < ownerCIds.size(); i++) {
            if (i > 0) filter.append("&");
            filter.append("filters%5Bowner_cId%5D%5B$in%5D%5B").append(i).append("%5D=").append(ownerCIds.get(i));
        }
        String url = strapiBaseUrl + "/hzd-plugin/dogs?" + filter + "&pagination%5BpageSize%5D=" + pageSize;
        return fetch(url);
    }

    private String fetch(String url) throws Exception {
        LOG.info("[StrapiClient] Fetching URL: " + url);

        long startTime = System.currentTimeMillis();
        io.vertx.ext.web.client.HttpRequest<Buffer> request = getClient().getAbs(url)
                .putHeader("Content-Type", "application/json")
                .putHeader("Authorization", "Bearer " + apiToken);

        HttpResponse<Buffer> response = request.send().toCompletionStage().toCompletableFuture().get();

        long duration = System.currentTimeMillis() - startTime;
        LOG.info("[StrapiClient] Response received in " + duration + "ms - Status: " + response.statusCode() + " - Body length: " + response.body().length() + " bytes");

        if (response.statusCode() >= 400) {
            LOG.error("[StrapiClient] HTTP Error " + response.statusCode() + " - Body: " + response.body());
            throw new StrapiClientException("Strapi request failed: " + response.statusCode() + " - " + response.body());
        }

        return response.body().toString();
    }
}
