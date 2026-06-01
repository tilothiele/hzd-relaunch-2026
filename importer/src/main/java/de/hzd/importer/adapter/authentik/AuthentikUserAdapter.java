package de.hzd.importer.adapter.authentik;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.hzd.importer.domain.Member;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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

	private final HttpClient httpClient = HttpClient.newBuilder()
		.connectTimeout(Duration.ofSeconds(30))
		.build();

	private Map<String, AuthentikUserSnapshot> importCache = Map.of();
	private AuthentikGroupMapper groupMapper = AuthentikGroupMapper.empty();

	public enum UpsertResult {
		CREATED,
		UPDATED,
		DELETED,
		SKIPPED
	}

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

	public void setImportCache(Map<String, AuthentikUserSnapshot> users) {
		importCache = users != null ? users : Map.of();
	}

	public void clearImportCache() {
		importCache = Map.of();
		groupMapper = AuthentikGroupMapper.empty();
	}

	public UpsertResult delete(Member member) {
		String username = member.username();
		Optional<JsonNode> existingUser = findUserByUsername(username);
		if (existingUser.isEmpty()) {
			LOG.infof(
				"Skipping Authentik delete for cId=%d username=%s: user not found",
				member.cId(),
				username
			);
			return UpsertResult.SKIPPED;
		}

		int pk = existingUser.get().path("pk").asInt();
		deleteUser(pk);
		removeFromImportCache(username);
		LOG.infof(
			"Deleted Authentik user cId=%d username=%s pk=%d",
			member.cId(),
			username,
			pk
		);
		return UpsertResult.DELETED;
	}

	public UpsertResult upsert(Member member) {
//		if (member.cEmail().isEmpty()) {
//			LOG.warnf("Skipping Authentik sync for cId=%d: no valid email in CSV", member.cId());
//			return UpsertResult.SKIPPED;
//		}

		String username = member.username();
		Optional<JsonNode> existingUser = findUserByUsername(username);
		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(member, groupMapper);

		if (existingUser.isPresent()) {
			int pk = existingUser.get().path("pk").asInt();
			patchUser(pk, payload);
			LOG.infof("Updated Authentik user username=%s pk=%d", username, pk);
			return UpsertResult.UPDATED;
		}

		postUser(payload);
		LOG.infof("Created Authentik user username=%s", username);
		return UpsertResult.CREATED;
	}

	private Optional<JsonNode> findUserByUsername(String username) {
		AuthentikUserSnapshot cachedUser = importCache.get(username);
		if (cachedUser != null) {
			return Optional.of(toJsonNode(cachedUser));
		}

		try {
			String url = usersUrl() + "?search=" + username;
			JsonNode body = fetchPage(url);
			JsonNode results = body.path("results");
			if (!results.isArray()) {
				return Optional.empty();
			}
			for (JsonNode user : results) {
				if (username.equals(user.path("username").asText())) {
					return Optional.of(user);
				}
			}
			return Optional.empty();
		} catch (Exception exception) {
			throw new AuthentikClientException("Failed to find Authentik user", exception);
		}
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

	private void removeFromImportCache(String username) {
		if (!importCache.containsKey(username)) {
			return;
		}
		Map<String, AuthentikUserSnapshot> updatedUsers = new LinkedHashMap<>(importCache);
		updatedUsers.remove(username);
		importCache = updatedUsers;
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
		return httpClient.send(buildRequest(url, "GET", null), HttpResponse.BodyHandlers.ofString());
	}

	private HttpResponse<String> sendPost(String url, String body) throws Exception {
		return httpClient.send(buildRequest(url, "POST", body), HttpResponse.BodyHandlers.ofString());
	}

	private HttpResponse<String> sendPatch(String url, String body) throws Exception {
		return httpClient.send(buildRequest(url, "PATCH", body), HttpResponse.BodyHandlers.ofString());
	}

	private HttpResponse<String> sendDelete(String url) throws Exception {
		return httpClient.send(buildRequest(url, "DELETE", null), HttpResponse.BodyHandlers.ofString());
	}

	private HttpRequest buildRequest(String url, String method, String body) {
		HttpRequest.Builder builder = HttpRequest.newBuilder()
			.uri(URI.create(url))
			.timeout(config.authentik().httpTimeout())
			.header("Accept", "application/json")
			.header("Content-Type", "application/json");
		config.authentik().apiToken().ifPresent(token ->
			builder.header("Authorization", "Bearer " + token)
		);
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
