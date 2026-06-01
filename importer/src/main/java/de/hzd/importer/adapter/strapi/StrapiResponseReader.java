package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Optional;

final class StrapiResponseReader {

	private StrapiResponseReader() {
	}

	static JsonNode readResultItems(JsonNode response) {
		if (response == null || response.isNull()) {
			return null;
		}
		JsonNode data = response.get("data");
		if (data != null && data.isArray()) {
			return data;
		}
		if (response.isArray()) {
			return response;
		}
		return null;
	}

	static Optional<Integer> readNumericId(JsonNode item) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}

		JsonNode id = item.get("id");
		if (id != null && id.isNumber()) {
			int value = id.asInt(-1);
			return value > 0 ? Optional.of(value) : Optional.empty();
		}
		if (id != null && id.isTextual()) {
			try {
				int value = Integer.parseInt(id.asText().trim());
				return value > 0 ? Optional.of(value) : Optional.empty();
			} catch (NumberFormatException exception) {
				return Optional.empty();
			}
		}

		return Optional.empty();
	}

	static Optional<String> readDocumentId(JsonNode item) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}
		JsonNode documentId = item.get("documentId");
		if (documentId != null && documentId.isTextual()) {
			String value = documentId.asText().trim();
			if (!value.isEmpty()) {
				return Optional.of(value);
			}
		}
		return Optional.empty();
	}

	static Optional<String> readResourceId(JsonNode item) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}

		Optional<String> documentId = readDocumentId(item);
		if (documentId.isPresent()) {
			return documentId;
		}

		JsonNode id = item.get("id");
		if (id != null && !id.isNull()) {
			String value = id.asText().trim();
			if (!value.isEmpty()) {
				return Optional.of(value);
			}
		}

		return Optional.empty();
	}

	static Optional<Boolean> readBooleanField(JsonNode item, String field) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}
		JsonNode value = item.get(field);
		if (value == null || value.isNull()) {
			return Optional.empty();
		}
		if (value.isBoolean()) {
			return Optional.of(value.asBoolean());
		}
		if (value.isNumber()) {
			return Optional.of(value.asInt() != 0);
		}
		if (value.isTextual()) {
			String text = value.asText().trim().toLowerCase();
			return switch (text) {
				case "1", "true" -> Optional.of(true);
				case "0", "false" -> Optional.of(false);
				default -> Optional.empty();
			};
		}
		return Optional.empty();
	}

	static Optional<String> readTextField(JsonNode item, String field) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}
		JsonNode value = item.get(field);
		if (value == null || value.isNull()) {
			return Optional.empty();
		}
		String text = value.asText().trim();
		return text.isEmpty() ? Optional.empty() : Optional.of(text);
	}

	static boolean hasNextPage(JsonNode response, int currentPage, int itemsOnPage, int pageSize) {
		if (itemsOnPage <= 0) {
			return false;
		}
		if (usesRootArray(response) || !hasPaginationMeta(response)) {
			return false;
		}

		JsonNode pagination = response.path("meta").path("pagination");
		int pageCount = pagination.path("pageCount").asInt(-1);
		if (pageCount > 0) {
			return currentPage < pageCount;
		}

		int total = pagination.path("total").asInt(-1);
		if (total > 0) {
			return currentPage * pageSize < total;
		}

		return itemsOnPage >= pageSize;
	}

	private static boolean usesRootArray(JsonNode response) {
		return response != null && response.isArray();
	}

	private static boolean hasPaginationMeta(JsonNode response) {
		if (response == null || response.isNull() || response.isArray()) {
			return false;
		}
		JsonNode pagination = response.path("meta").path("pagination");
		return !pagination.isMissingNode() && !pagination.isNull();
	}
}
