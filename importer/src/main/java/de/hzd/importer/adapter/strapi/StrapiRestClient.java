package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiRestClient {

	private static final Logger LOG = Logger.getLogger(StrapiRestClient.class);

	@Inject
	ImporterConfig config;

	@Inject
	ObjectMapper objectMapper;

	private final HttpClient httpClient = HttpClient.newBuilder()
		.connectTimeout(Duration.ofSeconds(30))
		.build();

	public JsonNode list(String resourcePath, Map<String, String> queryParams) {
		String query = buildQueryString(queryParams);
		String path = resourcePath + (query.isEmpty() ? "" : "?" + query);
		return send("GET", path, null);
	}

	public JsonNode create(String resourcePath, Map<String, Object> payload, boolean wrapInData) {
		return send("POST", resourcePath, wrapPayload(payload, wrapInData));
	}

	public JsonNode update(
		String resourcePath,
		String documentId,
		Map<String, Object> payload,
		boolean wrapInData
	) {
		return send("PUT", resourcePath + "/" + documentId, wrapPayload(payload, wrapInData));
	}

	public JsonNode updateUser(int numericUserId, Map<String, Object> payload) {
		return update(
			StrapiResources.USERS,
			Integer.toString(numericUserId),
			payload,
			false
		);
	}

	public Optional<StrapiUserRef> findUserRefByCId(int cId) {
		Optional<StrapiUserRef> rv = firstUserRef(
			list(
				StrapiResources.USERS,
				Map.of("filters[cId][$eq]", Integer.toString(cId))
			)
		);
		Log.infof("find user by cId=%d found=%b", cId, rv!=null && rv.isPresent());
		return rv;
	}

	public Optional<StrapiUserRef> findUserRefByEmail(String email) {
		return firstUserRef(
			list(
				StrapiResources.USERS,
				Map.of("filters[email][$eq]", email)
			)
		);
	}

	public Optional<StrapiUserRef> findUserRefByUsername(String username) {
		return firstUserRef(
			list(
				StrapiResources.USERS,
				Map.of("filters[username][$eq]", username)
			)
		);
	}

	public Optional<String> findDocumentIdByCId(String resourcePath, int cId) {
		JsonNode response = list(
			resourcePath,
			Map.of("filters[cId][$eq]", Integer.toString(cId))
		);
		return firstResourceId(response);
	}

	public Optional<String> findUserDocumentIdByEmail(String email) {
		return findUserRefByEmail(email).map(StrapiUserRef::documentId);
	}

	public Optional<String> findUserDocumentIdByUsername(String username) {
		return findUserRefByUsername(username).map(StrapiUserRef::documentId);
	}

	public JsonNode listAllPaginated(String resourcePath, int page, int pageSize) {
		Map<String, String> query = new LinkedHashMap<>();
		query.put("pagination[page]", Integer.toString(page));
		query.put("pagination[pageSize]", Integer.toString(pageSize));
		query.put("sort[0]", "cId:asc");
		return list(resourcePath, query);
	}

	public Optional<String> readDocumentId(JsonNode response) {
		JsonNode dataDocumentId = response.path("data").path("documentId");
		if (!dataDocumentId.isMissingNode() && !dataDocumentId.isNull()) {
			return Optional.of(dataDocumentId.asText());
		}
		JsonNode rootDocumentId = response.path("documentId");
		if (!rootDocumentId.isMissingNode() && !rootDocumentId.isNull()) {
			return Optional.of(rootDocumentId.asText());
		}
		return Optional.empty();
	}

	public void delayBetweenRequests() {
		sleep(config.strapi().requestDelay().toMillis());
	}

	private Optional<StrapiUserRef> firstUserRef(JsonNode response) {
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return Optional.empty();
		}
		return StrapiUserRef.fromJson(items.get(0));
	}

	private Optional<String> firstResourceId(JsonNode response) {
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return Optional.empty();
		}
		return StrapiResponseReader.readResourceId(items.get(0));
	}

	private JsonNode send(String method, String resourcePath, JsonNode body) {
		int maxAttempts = Math.max(1, config.strapi().maxRetries());
		RuntimeException lastException = null;
		for (int attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return sendOnce(method, resourcePath, body);
			} catch (StrapiTransientException exception) {
				lastException = exception;
				if (attempt < maxAttempts) {
					long delayMs = config.retry().initialDelay().toMillis()
						* (1L << (attempt - 1));
					delayMs = Math.min(delayMs, config.retry().maxDelay().toMillis());
					LOG.warnf(
						exception,
						"Transient Strapi error, retry %d/%d in %dms",
						attempt,
						maxAttempts,
						delayMs
					);
					sleep(delayMs);
				}
			}
		}
		throw lastException != null
			? lastException
			: new StrapiClientException("Strapi request failed");
	}

	private JsonNode sendOnce(String method, String resourcePath, JsonNode body) {
		try {
			String url = config.strapi().baseUrl().replaceAll("/+$", "")
				+ normalizeResourcePath(resourcePath);

			HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
				.uri(URI.create(url))
				.timeout(config.strapi().httpTimeout())
				.header("Accept", "application/json");

			config.strapi().apiToken().ifPresent(token ->
				requestBuilder.header("Authorization", "Bearer " + token)
			);

			if (body != null) {
				requestBuilder
					.header("Content-Type", "application/json")
					.method(
						method,
						HttpRequest.BodyPublishers.ofString(body.toString())
					);
			} else {
				requestBuilder.method(method, HttpRequest.BodyPublishers.noBody());
			}

			HttpResponse<String> response = httpClient.send(
				requestBuilder.build(),
				HttpResponse.BodyHandlers.ofString()
			);

			if (response.statusCode() >= 500) {
				throw new StrapiTransientException(
					"Strapi returned HTTP " + response.statusCode()
				);
			}
			if (response.statusCode() >= 400) {
				throw new StrapiClientException(
					"Strapi returned HTTP " + response.statusCode()
						+ ": " + response.body()
				);
			}

			if (response.body() == null || response.body().isBlank()) {
				return objectMapper.createObjectNode();
			}
			return objectMapper.readTree(response.body());
		} catch (StrapiClientException exception) {
			throw exception;
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new StrapiClientException("Strapi request interrupted", exception);
		} catch (Exception exception) {
			throw new StrapiTransientException("Strapi request failed", exception);
		}
	}

	private JsonNode wrapPayload(Map<String, Object> payload, boolean wrapInData) {
		if (!wrapInData) {
			return objectMapper.valueToTree(payload);
		}
		ObjectNode body = objectMapper.createObjectNode();
		body.set("data", objectMapper.valueToTree(payload));
		return body;
	}

	private String normalizeResourcePath(String resourcePath) {
		if (resourcePath.startsWith("/")) {
			return resourcePath;
		}
		return "/" + resourcePath;
	}

	private String buildQueryString(Map<String, String> queryParams) {
		if (queryParams == null || queryParams.isEmpty()) {
			return "";
		}
		return queryParams.entrySet().stream()
			.map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
			.collect(Collectors.joining("&"));
	}

	private String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private void sleep(long delayMs) {
		if (delayMs <= 0) {
			return;
		}
		try {
			Thread.sleep(delayMs);
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
		}
	}
}