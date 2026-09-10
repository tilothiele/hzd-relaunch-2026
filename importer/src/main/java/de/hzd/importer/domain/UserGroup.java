package de.hzd.importer.domain;

import java.util.Optional;

public record UserGroup(
		String documentId,
		int id,
		Optional<String> name
) {
	public static final String UNDEFINED_DOCUMENT_ID = "";
	public static final int UNDEFINED_ID = 0;

	public UserGroup {
		documentId = documentId == null ? UNDEFINED_DOCUMENT_ID : documentId;
		name = name == null ? Optional.empty() : name;
	}

	public boolean hasStrapiIdentity() {
		return id != UNDEFINED_ID && !documentId.isBlank();
	}
}
