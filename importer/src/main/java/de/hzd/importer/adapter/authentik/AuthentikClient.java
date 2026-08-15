package de.hzd.importer.adapter.authentik;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.hzd.importer.domain.AuthentikUser;
import de.hzd.importer.domain.AuthentikUserCache;
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
public class AuthentikClient {

    private static final Logger LOG = Logger.getLogger(AuthentikClient.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "importer.authentik.base-url", defaultValue = "https://auth.hovawarte.com")
    String authentikBaseUrl;

    @ConfigProperty(name = "importer.authentik.api-token")
    String apiToken;

    private WebClient webClient;

    private WebClient getClient() {
        if (webClient == null) {
            WebClientOptions options = new WebClientOptions()
                    .setConnectTimeout(60000)
                    .setIdleTimeout(120)
                    .setFollowRedirects(true);
            webClient = WebClient.create(vertx, options);
        }
        return webClient;
    }

    /**
     * Fetch all users from Authentik and add directly to cache.
     * @return number of users fetched
     */
    public int fetchAllUsers(AuthentikUserCache cache, Ticker ticker) throws Exception {
        int totalFetched = 0;
        int page = 1;
        int pageCount = 1;

        while (page <= pageCount) {
            String url = authentikBaseUrl + "/api/v3/core/users/?page=" + page + "&page_size=100";
            String response = fetch(url);

            LOG.info("[AuthentikClient] Response body: " + response.substring(0, Math.min(1000, response.length())));

            JsonNode root = objectMapper.readTree(response);

            // Try different pagination structures
            int total = 0;
            JsonNode pagination = root.get("pagination");
            if (pagination != null) {
                pageCount = pagination.get("total_pages").asInt();
                total = pagination.get("count").asInt();
            } else if (root.has("count")) {
                // Alternative: count at root level
                total = root.get("count").asInt();
            }

            LOG.info("[AuthentikClient] Users page " + page + "/" + pageCount + " (total: " + total + ")");

            JsonNode results = root.get("results");
            if (results == null || !results.isArray()) {
                LOG.warn("[AuthentikClient] No 'results' array in response");
                break;
            }

            if (results.isEmpty()) {
                LOG.info("[AuthentikClient] Empty results - stopping");
                break;
            }

            for (JsonNode item : results) {
                AuthentikUser user = AuthentikUserMapper.parseUser(item);
                if (user != null) {
                    cache.add(user);
                    totalFetched++;
                    final Integer cId = user.getCId().orElse(null);
                    ticker.tick(new Runnable() {
                        @Override
                        public void run() {
                            LOG.debug("Last parsed authentik user cId=" + cId);
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
        LOG.info("[AuthentikClient] Total users fetched: " + totalFetched);
        return totalFetched;
    }

    private String fetch(String url) throws Exception {
        LOG.info("[AuthentikClient] Fetching URL: " + url);

        long startTime = System.currentTimeMillis();
        io.vertx.ext.web.client.HttpRequest<Buffer> request = getClient().getAbs(url)
                .putHeader("Content-Type", "application/json")
                .putHeader("Authorization", "Bearer " + apiToken);

        HttpResponse<Buffer> response = request.send().toCompletionStage().toCompletableFuture().get();

        long duration = System.currentTimeMillis() - startTime;
        LOG.info("[AuthentikClient] Response received in " + duration + "ms - Status: " + response.statusCode() + " - Body length: " + response.body().length() + " bytes");

        if (response.statusCode() >= 400) {
            LOG.error("[AuthentikClient] HTTP Error " + response.statusCode() + " - Body: " + response.body());
            throw new RuntimeException("Authentik request failed: " + response.statusCode());
        }

        return response.body().toString();
    }
}