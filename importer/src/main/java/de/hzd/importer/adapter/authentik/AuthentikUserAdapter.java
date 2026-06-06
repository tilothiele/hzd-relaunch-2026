package de.hzd.importer.adapter.authentik;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.hzd.importer.domain.Member;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AuthentikUserAdapter {

	private static final Logger LOG = Logger.getLogger(AuthentikUserAdapter.class);

	@Inject
	ImporterConfig config;

	@Inject
	ObjectMapper objectMapper;

	@Inject
	AuthentikApiAuthentication authentikAuth;

	private AuthentikGroupMapper groupMapper = AuthentikGroupMapper.empty();

	public record AuthentikUserSnapshot(
		int pk,
		String username,
		Optional<String> email,
		Optional<String> name,
		boolean active
	) {
		private static AuthentikUserSnapshot fromJson(JsonNode user) {
			return new AuthentikUserSnapshot(
				user.path("pk").asInt(),
				user.path("username").asText(),
				optionalText(user, "email"),
				optionalText(user, "name"),
				user.path("is_active").asBoolean(true)
			);
		}

		private static Optional<String> optionalText(JsonNode node, String field) {
			JsonNode value = node.get(field);
			if (value == null || value.isNull()) {
				return Optional.empty();
			}
			String text = value.asText().trim();
			return text.isEmpty() ? Optional.empty() : Optional.of(text);
		}
		
		public static int fingerPrint(String username, String email, boolean active) {
			return (username+email+active).hashCode();
		}
		
		public int fingerPrint() {
			return fingerPrint(username, email.orElse(""), active);
		}
	}

	public AuthentikGroupMapper fetchAllGroups() {
		try {
			int pageSize = config.authentik().pageSize();
			ArrayNode allGroups = objectMapper.createArrayNode();
			int page = 1;

			while (true) {
				String url = groupsUrl() + "?page=" + page + "&page_size=" + pageSize;
				JsonNode body = fetchPage(url);
				JsonNode results = body.path("results");
				if (!results.isArray() || results.isEmpty()) {
					break;
				}

				for (JsonNode group : results) {
					allGroups.add(group);
				}

				if (results.size() < pageSize || !hasNextPage(body, page)) {
					break;
				}
				page++;
			}

			AuthentikGroupMapper mapper = AuthentikGroupMapper.fromApiResults(allGroups);
			LOG.infof("Fetched %d groups from Authentik", mapper.size());
			return mapper;
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to fetch Authentik groups", exception);
		}
	}

	public void setGroupMapper(AuthentikGroupMapper groupMapper) {
		this.groupMapper = groupMapper != null ? groupMapper : AuthentikGroupMapper.empty();
	}

	public void clearGroupMapper() {
		groupMapper = AuthentikGroupMapper.empty();
	}

	public Map<String, AuthentikUserSnapshot> fetchAllUsers() {
		try {
			int pageSize = config.authentik().pageSize();
			Map<String, AuthentikUserSnapshot> users = new LinkedHashMap<>();
			int page = 1;
			JsonNode lastBody = null;

			while (true) {
				Log.info("fetching user from Authentik - page #"+page);
				String url = usersUrl() + "?page=" + page + "&page_size=" + pageSize;
				JsonNode body = fetchPage(url);
				lastBody = body;
				JsonNode results = body.path("results");
				if (!results.isArray() || results.isEmpty()) {
					break;
				}

				for (JsonNode user : results) {
					String username = user.path("username").asText(null);
					if (username != null && !username.isBlank()) {
						users.put(username, AuthentikUserSnapshot.fromJson(user));
					}
				}

				if (results.size() < pageSize || !hasNextPage(body, page)) {
					break;
				}
				page++;
			}

			LOG.infof("Fetched %d users from Authentik", users.size());
			if (users.isEmpty() && lastBody != null) {
				logEmptyUserListHint(lastBody);
			}
			return users;
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to fetch Authentik users", exception);
		}
	}

	public enum UpsertResult {
		CREATED,
		UPDATED,
		DELETED,
		SKIPPED
	}

	public record DeleteAllUsersResult(int deleted, int total) {
	}

	public boolean doDelete(AuthentikUserSnapshot member) {
		return member.username().startsWith("c."); // alle chromosoft user // nicht-hzd
	}

	public DeleteAllUsersResult deleteAllUsers() {
		Map<String, AuthentikUserSnapshot> users = fetchAllUsers();
		int deleted = 0;

		for (AuthentikUserSnapshot user : users.values()) {
			if(!doDelete(user)) continue;
			deleteUser(user.pk());
			deleted++;
			LOG.infof(
				"Deleted Authentik user username=%s pk=%d",
				user.username(),
				user.pk()
			);
		}

		clearImportCache();
		LOG.infof("Deleted %d of %d Authentik users", deleted, users.size());
		return new DeleteAllUsersResult(deleted, users.size());
	}

	public void clearImportCache() {
		groupMapper = AuthentikGroupMapper.empty();
	}

	public UpsertResult upsert(Member member) {
		String username = member.username();
		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(
			member,
			groupMapper,
			config.authentik().defaultGroups()
		);

		postUser(payload);
		LOG.infof("Created Authentik user username=%s", username);
		return UpsertResult.CREATED;
	}

	private JsonNode fetchPage(String url) throws Exception {
		HttpResponse<String> response = sendGet(url);
		if (response.statusCode() >= 400) {
			throw new AuthentikClientException(
				"Authentik list users failed: HTTP " + response.statusCode()
					+ " " + response.body()
			);
		}
		return objectMapper.readTree(response.body());
	}

	private JsonNode toJsonNode(AuthentikUserSnapshot user) {
		ObjectNode node = objectMapper.createObjectNode();
		node.put("pk", user.pk());
		node.put("username", user.username());
		user.email().ifPresent(email -> node.put("email", email));
		user.name().ifPresent(name -> node.put("name", name));
		node.put("is_active", user.active());
		return node;
	}

	private void logEmptyUserListHint(JsonNode body) {
		JsonNode pagination = body.path("pagination");
		int count = pagination.path("count").asInt(-1);
		if (count > 0) {
			LOG.warnf(
				"Authentik reports %d users but none were indexed; check username fields in API response",
				count
			);
			return;
		}
		if (count == 0) {
			LOG.info("Authentik user list is empty (pagination.count=0)");
			return;
		}
		LOG.warnf(
			"Authentik user list returned no results; verify importer.authentik.base-url and API token"
		);
	}

	private boolean hasNextPage(JsonNode body, int currentPage) {
		JsonNode pagination = body.path("pagination");
		JsonNode nextPage = pagination.get("next");
		if (nextPage != null && !nextPage.isNull()) {
			if (nextPage.isInt()) {
				return nextPage.asInt() > currentPage;
			}
			if (nextPage.isTextual()) {
				return !nextPage.asText().isBlank();
			}
		}

		JsonNode totalPages = pagination.get("total_pages");
		if (totalPages != null && totalPages.isInt()) {
			return currentPage < totalPages.asInt();
		}

		return false;
	}

	private void deleteUser(int pk) {
		try {
			HttpResponse<String> response = sendDelete(usersUrl() + pk + "/");
			if (response.statusCode() >= 400) {
				throw new AuthentikClientException(
					"Authentik delete failed: HTTP " + response.statusCode()
						+ " " + response.body()
				);
			}
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to delete Authentik user", exception);
		}
	}

	private void postUser(Map<String, Object> payload) {
		try {
			ObjectNode body = objectMapper.valueToTree(payload);
			body.put("type", "internal");
			HttpResponse<String> response = sendPost(usersUrl(), body.toString());
			if (response.statusCode() >= 400) {
				throw new AuthentikClientException(
					"Authentik create failed: HTTP " + response.statusCode()
						+ " " + response.body()
				);
			}
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to create Authentik user", exception);
		}
	}

	private void patchUser(int pk, Map<String, Object> payload) {
		try {
			String body = objectMapper.writeValueAsString(payload);
			HttpResponse<String> response = sendPatch(usersUrl() + pk + "/", body);
			if (response.statusCode() >= 400) {
				throw new AuthentikClientException(
					"Authentik update failed: HTTP " + response.statusCode()
						+ " " + response.body()
				);
			}
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to update Authentik user", exception);
		}
	}

	private HttpResponse<String> sendGet(String url) throws Exception {
		return authentikAuth.getHttpClient().send(
			buildRequest(url, "GET", null),
			HttpResponse.BodyHandlers.ofString()
		);
	}

	private HttpResponse<String> sendPost(String url, String body) throws Exception {
		return authentikAuth.getHttpClient().send(
			buildRequest(url, "POST", body),
			HttpResponse.BodyHandlers.ofString()
		);
	}

	private HttpResponse<String> sendPatch(String url, String body) throws Exception {
		return authentikAuth.getHttpClient().send(
			buildRequest(url, "PATCH", body),
			HttpResponse.BodyHandlers.ofString()
		);
	}

	private HttpResponse<String> sendDelete(String url) throws Exception {
		return authentikAuth.getHttpClient().send(
			buildRequest(url, "DELETE", null),
			HttpResponse.BodyHandlers.ofString()
		);
	}

	private HttpRequest buildRequest(String url, String method, String body) {
		authentikAuth.validateConfiguration();
		URI requestUri = URI.create(url);
		HttpRequest.Builder builder = HttpRequest.newBuilder()
			.uri(requestUri)
			.timeout(config.authentik().httpTimeout())
			.header("Accept", "application/json")
			.header("Content-Type", "application/json");
		authentikAuth.applyAuthHeaders(builder, requestUri);
		return switch (method) {
			case "GET" -> builder.GET().build();
			case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
			case "PATCH" -> builder.method("PATCH", HttpRequest.BodyPublishers.ofString(body)).build();
			case "DELETE" -> builder.DELETE().build();
			default -> throw new IllegalArgumentException("Unsupported method: " + method);
		};
	}

	private String groupsUrl() {
		String baseUrl = config.authentik().baseUrl().replaceAll("/+$", "");
		if (baseUrl.endsWith("/api/v3/core/groups")) {
			return baseUrl + "/";
		}
		return baseUrl + "/api/v3/core/groups/";
	}

	private String usersUrl() {
		String baseUrl = config.authentik().baseUrl().replaceAll("/+$", "");
		if (baseUrl.endsWith("/api/v3/core/users")) {
			return baseUrl + "/";
		}
		return baseUrl + "/api/v3/core/users/";
	}
}
