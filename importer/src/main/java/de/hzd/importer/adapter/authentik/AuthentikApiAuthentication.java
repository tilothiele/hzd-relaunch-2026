package de.hzd.importer.adapter.authentik;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AuthentikApiAuthentication {

	private static final Logger LOG = Logger.getLogger(AuthentikApiAuthentication.class);
	private static final String DEFAULT_AUTH_FLOW = "default-authentication-flow";
	private static final String SESSION_COOKIE_NAME = "authentik_session";
	private static final int MAX_FLOW_STEPS = 12;
	private static final int MAX_REDIRECTS = 8;

	@Inject
	ImporterConfig config;

	@Inject
	ObjectMapper objectMapper;

	private final Map<String, String> cookies = new LinkedHashMap<>();
	private HttpClient httpClient;
	private volatile boolean sessionAuthenticated;

	public HttpClient getHttpClient() {
		if (httpClient == null) {
			httpClient = HttpClient.newBuilder()
				.connectTimeout(config.authentik().httpTimeout())
				.followRedirects(HttpClient.Redirect.NEVER)
				.build();
		}
		return httpClient;
	}

	public void applyAuthHeaders(HttpRequest.Builder builder, URI requestUri) {
		Optional<String> apiToken = normalizedApiToken();
		if (apiToken.isPresent()) {
			builder.header("Authorization", "Bearer " + apiToken.get());
			return;
		}

		ensureSessionAuthenticated();
		applyCookies(builder);
		builder.header("Referer", buildBaseUrl() + "/");

		String csrfToken = getCookie("authentik_csrf");
		if (!csrfToken.isBlank()) {
			builder.header("X-authentik-CSRF", csrfToken);
		}
	}

	public void validateConfiguration() {
		if (normalizedApiToken().isPresent()) {
			return;
		}

		if (hasUsernamePasswordCredentials()) {
			return;
		}

		throw new AuthentikClientException(
			"Authentik API authentication is not configured: set "
				+ "IMPORTER_AUTHENTIK_API_TOKEN or both "
				+ "IMPORTER_AUTHENTIK_USERNAME and IMPORTER_AUTHENTIK_PASSWORD"
		);
	}

	private Optional<String> normalizedApiToken() {
		return config.authentik()
			.apiToken()
			.map(String::trim)
			.filter(token -> !token.isEmpty());
	}

	private boolean hasUsernamePasswordCredentials() {
		return normalizedUsername().isPresent() && normalizedPassword().isPresent();
	}

	private Optional<String> normalizedUsername() {
		return config.authentik()
			.username()
			.map(String::trim)
			.filter(value -> !value.isEmpty());
	}

	private Optional<String> normalizedPassword() {
		return config.authentik()
			.password()
			.filter(value -> !value.isEmpty());
	}

	private synchronized void ensureSessionAuthenticated() {
		if (sessionAuthenticated) {
			return;
		}

		validateConfiguration();

		String username = normalizedUsername().orElseThrow(() ->
			new AuthentikClientException(
				"IMPORTER_AUTHENTIK_USERNAME is required when no API token is configured"
			)
		);
		String password = normalizedPassword().orElseThrow(() ->
			new AuthentikClientException(
				"IMPORTER_AUTHENTIK_PASSWORD is required when no API token is configured"
			)
		);

		String flowSlug = config.authentik()
			.authFlow()
			.map(String::trim)
			.filter(value -> !value.isEmpty())
			.orElse(DEFAULT_AUTH_FLOW);
		String executorUrl = buildFlowExecutorUrl(flowSlug);

		try {
			HttpResponse<String> initialResponse = sendAuthenticatedGet(executorUrl, executorUrl);
			if (initialResponse.statusCode() >= 400) {
				throw new AuthentikClientException(
					"Authentik login flow failed: HTTP "
						+ initialResponse.statusCode()
						+ " "
						+ initialResponse.body()
				);
			}

			FlowContext flowContext = new FlowContext(buildBaseUrl(), executorUrl);
			JsonNode challenge = parseChallengeBody(initialResponse);
			executeFlow(flowContext, challenge, username, password);
			verifyAuthenticatedSession();
			sessionAuthenticated = true;
			LOG.infof(
				"Authenticated against Authentik via username/password flow '%s'",
				flowSlug
			);
		} catch (AuthentikClientException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new AuthentikClientException(
				"Failed to authenticate against Authentik with username/password",
				exception
			);
		}
	}

	private void executeFlow(
		FlowContext flowContext,
		JsonNode challenge,
		String username,
		String password
	) throws Exception {
		JsonNode currentChallenge = challenge;
		String lastComponent = "";

		for (int step = 0; step < MAX_FLOW_STEPS; step++) {
			if (currentChallenge == null) {
				return;
			}

			String component = currentChallenge.path("component").asText("");
			if (component.isBlank()) {
				throw new AuthentikClientException(
					"Authentik login flow returned a challenge without component"
				);
			}

			flowContext.ensureFlowProgress(component, lastComponent);
			lastComponent = component;
			LOG.infof(
				"Authentik flow stage %d: %s",
				step + 1,
				component
			);

			if ("xak-flow-redirect".equals(component)) {
				completeFlowRedirect(currentChallenge);
				return;
			}

			if ("ak-stage-access-denied".equals(component)) {
				String message = currentChallenge.path("error_message").asText(
					"Authentik login was denied"
				);
				throw new AuthentikClientException("Authentik login failed: " + message);
			}

			if ("ak-stage-user-login".equals(component)) {
				HttpResponse<String> loginGetResponse = sendAuthenticatedGet(
					flowContext.executorUrl(),
					flowContext.executorUrl()
				);
				currentChallenge = advanceFlow(flowContext, loginGetResponse);
				if (currentChallenge == null) {
					return;
				}
				component = currentChallenge.path("component").asText("");
				if ("xak-flow-redirect".equals(component)) {
					completeFlowRedirect(currentChallenge);
					return;
				}
				if (!"ak-stage-user-login".equals(component)) {
					continue;
				}
			}

			ObjectNode challengeResponse = buildChallengeResponse(
				currentChallenge,
				component,
				username,
				password
			);
			if ("ak-stage-identification".equals(component)) {
				LOG.infof(
					"Submitting Authentik identification for user_fields %s",
					formatUserFields(currentChallenge.path("user_fields"))
				);
			}

			HttpResponse<String> response = submitChallenge(
				flowContext.executorUrl(),
				challengeResponse
			);
			currentChallenge = advanceFlow(flowContext, response);
		}

		throw new AuthentikClientException(
			"Authentik login flow exceeded maximum number of stages"
				+ (lastComponent.isBlank() ? "" : " (last stage: " + lastComponent + ")")
		);
	}

	private JsonNode advanceFlow(FlowContext flowContext, HttpResponse<String> response)
		throws Exception {
		absorbSetCookies(response);

		if (response.statusCode() == 301 || response.statusCode() == 302) {
			flowContext.updateExecutorUrlFromLocation(
				response.headers().firstValue("Location").orElse("")
			);
			HttpResponse<String> redirectResponse = followRedirectChain(response, 0, flowContext);
			return advanceFlow(flowContext, redirectResponse);
		}

		if (response.statusCode() >= 400) {
			throw new AuthentikClientException(
				"Authentik login flow failed: HTTP "
					+ response.statusCode()
					+ " "
					+ response.body()
			);
		}

		JsonNode challenge = parseChallengeBody(response);
		assertNoChallengeErrors(challenge);
		String component = challenge.path("component").asText("");
		if ("xak-flow-redirect".equals(component)) {
			completeFlowRedirect(challenge);
			return null;
		}

		return challenge;
	}

	private void assertNoChallengeErrors(JsonNode challenge) {
		JsonNode errors = challenge.path("response_errors");
		if (!errors.isObject() || errors.isEmpty()) {
			return;
		}

		StringBuilder message = new StringBuilder("Authentik login failed");
		boolean identificationRejected = false;
		for (var entry : errors.properties()) {
			JsonNode fieldErrors = entry.getValue();
			if (!fieldErrors.isArray()) {
				continue;
			}

			for (JsonNode fieldError : fieldErrors) {
				String detail = fieldError.path("string").asText(
					fieldError.path("code").asText("")
				);
				if (detail.isBlank()) {
					continue;
				}

				message.append(": ").append(entry.getKey()).append(" - ").append(detail);
				if ("non_field_errors".equals(entry.getKey())
					&& detail.toLowerCase().contains("failed to authenticate")) {
					identificationRejected = true;
				}
			}
		}

		if (identificationRejected) {
			message.append(
				". IMPORTER_AUTHENTIK_USERNAME must match the Authentik web login"
			);
			String userFields = formatUserFields(challenge.path("user_fields"));
			if (!userFields.isBlank()) {
				message.append(" (accepted fields: ").append(userFields).append(')');
			}
			message.append(
				". Prefer IMPORTER_AUTHENTIK_API_TOKEN for automation."
			);
		}

		throw new AuthentikClientException(message.toString());
	}

	private String formatUserFields(JsonNode userFields) {
		if (!userFields.isArray() || userFields.isEmpty()) {
			return "";
		}

		StringBuilder formatted = new StringBuilder("[");
		for (int index = 0; index < userFields.size(); index++) {
			if (index > 0) {
				formatted.append(", ");
			}
			formatted.append(userFields.get(index).asText(""));
		}
		return formatted.append(']').toString();
	}

	private JsonNode parseChallengeBody(HttpResponse<String> response) throws Exception {
		String body = response.body();
		if (body == null || body.isBlank()) {
			throw new AuthentikClientException(
				"Authentik login flow returned an empty challenge body"
			);
		}
		return objectMapper.readTree(body);
	}

	private void completeFlowRedirect(JsonNode challenge) throws Exception {
		String redirectTarget = challenge.path("to").asText("");
		if (redirectTarget.isBlank()) {
			return;
		}

		HttpResponse<String> response = sendAuthenticatedGet(
			resolveUrl(redirectTarget).toString(),
			buildFlowExecutorUrl(
				config.authentik()
					.authFlow()
					.map(String::trim)
					.filter(value -> !value.isEmpty())
					.orElse(DEFAULT_AUTH_FLOW)
			)
		);
		absorbSetCookies(response);
	}

	private ObjectNode buildChallengeResponse(
		JsonNode challenge,
		String component,
		String username,
		String password
	) {
		ObjectNode body = objectMapper.createObjectNode();
		body.put("component", component);

		switch (component) {
			case "ak-stage-identification" -> {
				body.put("uid_field", username);
				if (challenge.path("password_fields").asBoolean(false)) {
					body.put("password", password);
				}
			}
			case "ak-stage-password" -> body.put("password", password);
			case "ak-stage-user-login" -> body.put("remember_me", false);
			default -> throw new AuthentikClientException(
				"Unsupported Authentik login stage: " + component
					+ ". Configure IMPORTER_AUTHENTIK_AUTH_FLOW or use an API token."
			);
		}

		return body;
	}

	private HttpResponse<String> submitChallenge(String executorUrl, ObjectNode body)
		throws Exception {
		HttpRequest.Builder builder = HttpRequest.newBuilder()
			.uri(URI.create(executorUrl))
			.timeout(config.authentik().httpTimeout())
			.header("Accept", "application/json")
			.header("Content-Type", "application/json")
			.header("Referer", executorUrl);

		applyCookies(builder);

		String csrfToken = getCookie("authentik_csrf");
		if (!csrfToken.isBlank()) {
			builder.header("X-authentik-CSRF", csrfToken);
		}

		HttpResponse<String> response = getHttpClient().send(
			builder.POST(HttpRequest.BodyPublishers.ofString(body.toString())).build(),
			HttpResponse.BodyHandlers.ofString()
		);
		absorbSetCookies(response);
		return response;
	}

	private HttpResponse<String> sendAuthenticatedGet(String url, String referer)
		throws Exception {
		HttpRequest.Builder builder = HttpRequest.newBuilder()
			.uri(URI.create(url))
			.timeout(config.authentik().httpTimeout())
			.header("Accept", "application/json")
			.header("Referer", referer);

		applyCookies(builder);

		String csrfToken = getCookie("authentik_csrf");
		if (!csrfToken.isBlank()) {
			builder.header("X-authentik-CSRF", csrfToken);
		}

		HttpResponse<String> response = getHttpClient().send(
			builder.GET().build(),
			HttpResponse.BodyHandlers.ofString()
		);
		absorbSetCookies(response);
		return response;
	}

	private HttpResponse<String> followRedirectChain(
		HttpResponse<String> response,
		int depth,
		FlowContext flowContext
	) throws Exception {
		if (depth >= MAX_REDIRECTS) {
			throw new AuthentikClientException(
				"Authentik login redirect chain exceeded maximum length"
			);
		}

		String location = response.headers().firstValue("Location").orElse("");
		if (location.isBlank()) {
			return response;
		}

		flowContext.updateExecutorUrlFromLocation(location);
		String redirectUrl = resolveUrl(location).toString();
		HttpResponse<String> redirectResponse = sendAuthenticatedGet(
			redirectUrl,
			flowContext.executorUrl()
		);
		if (redirectResponse.statusCode() == 301 || redirectResponse.statusCode() == 302) {
			return followRedirectChain(redirectResponse, depth + 1, flowContext);
		}

		return redirectResponse;
	}

	private void verifyAuthenticatedSession() throws Exception {
		String meUrl = buildBaseUrl() + "/api/v3/core/users/me/";
		HttpResponse<String> response = sendAuthenticatedGet(meUrl, meUrl);
		if (response.statusCode() == 200) {
			return;
		}

		if (getCookie(SESSION_COOKIE_NAME).isBlank()) {
			throw new AuthentikClientException(
				"Authentik session cookie missing after login. "
					+ "Ensure IMPORTER_AUTHENTIK_BASE_URL matches the public Authentik URL "
					+ "and the configured user can complete the authentication flow."
			);
		}

		throw new AuthentikClientException(
			"Authentik session is not authenticated: HTTP "
				+ response.statusCode()
				+ " "
				+ response.body()
		);
	}

	private void applyCookies(HttpRequest.Builder builder) {
		if (cookies.isEmpty()) {
			return;
		}

		String cookieHeader = cookies.entrySet()
			.stream()
			.map(entry -> entry.getKey() + "=" + entry.getValue())
			.collect(Collectors.joining("; "));
		builder.header("Cookie", cookieHeader);
	}

	private void absorbSetCookies(HttpResponse<?> response) {
		response.headers().allValues("set-cookie").forEach(header -> {
			String pair = header.split(";", 2)[0].trim();
			int separatorIndex = pair.indexOf('=');
			if (separatorIndex <= 0) {
				return;
			}

			String name = pair.substring(0, separatorIndex).trim();
			String value = pair.substring(separatorIndex + 1).trim();
			if (!name.isEmpty() && !value.isEmpty()) {
				cookies.put(name, value);
			}
		});
	}

	private String getCookie(String cookieName) {
		return cookies.getOrDefault(cookieName, "");
	}

	private String buildBaseUrl() {
		return config.authentik().baseUrl().replaceAll("/+$", "");
	}

	private String buildFlowExecutorUrl(String flowSlug) {
		return buildBaseUrl() + "/api/v3/flows/executor/" + flowSlug + "/";
	}

	private URI resolveUrl(String location) {
		return URI.create(buildBaseUrl() + "/").resolve(location);
	}

	private static final class FlowContext {
		private final String baseUrl;
		private String executorUrl;
		private int repeatedComponentCount;

		private FlowContext(String baseUrl, String executorUrl) {
			this.baseUrl = baseUrl.replaceAll("/+$", "");
			this.executorUrl = executorUrl;
		}

		private String executorUrl() {
			return executorUrl;
		}

		private void updateExecutorUrlFromLocation(String location) {
			if (location.isBlank()) {
				return;
			}

			String resolvedUrl = URI.create(baseUrl + "/").resolve(location).toString();
			if (resolvedUrl.contains("/flows/executor/")) {
				executorUrl = resolvedUrl;
			}
		}

		private void ensureFlowProgress(String component, String lastComponent) {
			if (component.equals(lastComponent)) {
				repeatedComponentCount++;
			} else {
				repeatedComponentCount = 1;
			}

			if (repeatedComponentCount >= 3) {
				throw new AuthentikClientException(
					"Authentik login flow stalled at stage '" + component + "'"
				);
			}
		}
	}
}
