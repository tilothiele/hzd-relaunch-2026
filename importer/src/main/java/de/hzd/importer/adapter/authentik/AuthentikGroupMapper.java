package de.hzd.importer.adapter.authentik;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.jboss.logging.Logger;

/**
 * Mappt Authentik-Gruppennamen auf die Group-UUID ({@code pk}) für User-Upserts.
 */
public final class AuthentikGroupMapper {

	private static final Logger LOG = Logger.getLogger(AuthentikGroupMapper.class);

	private final Map<String, String> nameToUuid;

	private AuthentikGroupMapper(Map<String, String> nameToUuid) {
		this.nameToUuid = Map.copyOf(nameToUuid);
	}

	public static AuthentikGroupMapper empty() {
		return new AuthentikGroupMapper(Map.of());
	}

	public static AuthentikGroupMapper fromApiResults(JsonNode results) {
		if (results == null || !results.isArray()) {
			return empty();
		}

		Map<String, String> groups = new LinkedHashMap<>();
		for (JsonNode group : results) {
			String name = group.path("name").asText(null);
			Optional<String> uuid = readGroupUuid(group);
			if (name == null || name.isBlank()) {
				continue;
			}
			if (uuid.isEmpty()) {
				LOG.warnf(
					"Skipping Authentik group without UUID pk: name=%s",
					name
				);
				continue;
			}
			groups.put(name, uuid.get());
		}
		return new AuthentikGroupMapper(groups);
	}

	public static AuthentikGroupMapper fromEntries(Map<String, String> entries) {
		if (entries == null || entries.isEmpty()) {
			return empty();
		}
		Map<String, String> groups = new LinkedHashMap<>();
		for (Map.Entry<String, String> entry : entries.entrySet()) {
			if (entry.getKey() == null || entry.getKey().isBlank()) {
				continue;
			}
			if (entry.getValue() == null || entry.getValue().isBlank()) {
				continue;
			}
			groups.put(entry.getKey(), entry.getValue());
		}
		return new AuthentikGroupMapper(groups);
	}

	public int size() {
		return nameToUuid.size();
	}

	public Optional<String> uuidForName(String groupName) {
		if (groupName == null || groupName.isBlank()) {
			return Optional.empty();
		}
		return Optional.ofNullable(nameToUuid.get(groupName));
	}

	public List<String> uuidsForNames(String[] groupNames) {
		if (groupNames == null || groupNames.length == 0) {
			return List.of();
		}

		return uuidsForNames(List.of(groupNames));
	}

	public List<String> uuidsForNames(List<String> groupNames) {
		if (groupNames == null || groupNames.isEmpty()) {
			return List.of();
		}

		Set<String> uuids = new LinkedHashSet<>();
		for (String groupName : groupNames) {
			if (groupName == null || groupName.isBlank()) {
				continue;
			}
			Optional<String> uuid = uuidForName(groupName);
			if (uuid.isPresent()) {
				uuids.add(uuid.get());
			} else {
				LOG.warnf("Authentik group not found: %s", groupName);
			}
		}
		return List.copyOf(uuids);
	}

	private static Optional<String> readGroupUuid(JsonNode group) {
		JsonNode pk = group.get("pk");
		if (pk == null || pk.isNull()) {
			return Optional.empty();
		}
		if (pk.isTextual()) {
			String uuid = pk.asText().trim();
			return uuid.isEmpty() ? Optional.empty() : Optional.of(uuid);
		}
		return Optional.empty();
	}
}
