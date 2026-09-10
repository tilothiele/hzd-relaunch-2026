package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import de.hzd.importer.domain.UserGroup;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

final class StrapiUserGroupMapper {

	private StrapiUserGroupMapper() {
	}

	static List<UserGroup> fromRelation(JsonNode relation) {
		JsonNode items = StrapiResponseReader.readRelationItems(relation);
		if (items == null || items.isEmpty()) {
			return List.of();
		}

		List<UserGroup> groups = new ArrayList<>();
		for (JsonNode item : items) {
			fromJson(item).ifPresent(groups::add);
		}
		return List.copyOf(groups);
	}

	static List<UserGroup> fromCollectionResponse(JsonNode response) {
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return List.of();
		}

		List<UserGroup> groups = new ArrayList<>();
		for (JsonNode item : items) {
			fromJson(item).ifPresent(groups::add);
		}
		return List.copyOf(groups);
	}

	static Optional<UserGroup> fromJson(JsonNode item) {
		if (item == null || item.isNull() || item.isMissingNode()) {
			return Optional.empty();
		}

		Optional<String> documentId = StrapiResponseReader.readResourceId(item);
		if (documentId.isEmpty()) {
			return Optional.empty();
		}

		int id = StrapiResponseReader.readNumericId(item).orElse(UserGroup.UNDEFINED_ID);
		return Optional.of(new UserGroup(documentId.get(), id, readName(item)));
	}

	private static Optional<String> readName(JsonNode item) {
		Optional<String> name = StrapiResponseReader.readTextField(item, "Name");
		if (name.isPresent()) {
			return name;
		}
		return StrapiResponseReader.readTextField(item.path("attributes"), "Name");
	}
}
