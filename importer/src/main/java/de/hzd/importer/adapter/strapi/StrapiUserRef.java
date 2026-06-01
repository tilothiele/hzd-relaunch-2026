package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Optional;

record StrapiUserRef(String documentId, int numericId) {

	static Optional<StrapiUserRef> fromJson(JsonNode item) {
		if (item == null || item.isNull()) {
			return Optional.empty();
		}

		Optional<Integer> numericId = StrapiResponseReader.readNumericId(item);
		if (numericId.isEmpty()) {
			return Optional.empty();
		}

		Optional<String> documentId = StrapiResponseReader.readDocumentId(item);
		String resolvedDocumentId = documentId.orElseGet(
			() -> Integer.toString(numericId.get())
		);
		return Optional.of(new StrapiUserRef(resolvedDocumentId, numericId.get()));
	}
}
