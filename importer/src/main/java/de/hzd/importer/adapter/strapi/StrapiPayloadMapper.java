package de.hzd.importer.adapter.strapi;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.Member;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

final class StrapiPayloadMapper {

	private StrapiPayloadMapper() {
	}

	static Map<String, Object> toUserInput(
		Member member,
		ImporterConfig config,
		boolean includePassword,
		int authenticatedRoleId
	) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("username", member.username());
		payload.put("email", member.strapiEmail());
		payload.put("provider", "local");
		payload.put("confirmed", true);
		payload.put("blocked", false);
		payload.put("role", authenticatedRoleId);
		payload.put("cId", member.cId());

		member.cEmail().ifPresent(value -> payload.put("cEmail", value));
		member.cFlagAccess().ifPresent(value -> payload.put("cFlagAccess", value));
		member.title().ifPresent(value -> payload.put("title", value));
		member.firstName().ifPresent(value -> payload.put("firstName", value));
		member.lastName().ifPresent(value -> payload.put("lastName", value));
		member.address1().ifPresent(value -> payload.put("address1", value));
		member.zip().map(StrapiPayloadMapper::truncateZip).ifPresent(value -> payload.put("zip", value));
		member.city().ifPresent(value -> payload.put("city", value));
		member.countryCode().ifPresent(value -> payload.put("countryCode", value));
		member.phone().ifPresent(value -> payload.put("phone", value));
		member.sex().ifPresent(value -> payload.put("sex", value.name()));
		member.cFlagBreeder().ifPresent(value -> payload.put("cFlagBreeder", value));
		member.membershipNumber().ifPresent(value -> payload.put("membershipNumber", value));
		member.dateOfBirth().ifPresent(value -> payload.put("dateOfBirth", value.toString()));
		member.dateOfDeath().ifPresent(value -> payload.put("dateOfDeath", value.toString()));
		member.memberSince().ifPresent(value -> payload.put("memberSince", value.toString()));
		member.cancellationOn().ifPresent(value -> payload.put("cancellationOn", value.toString()));
		member.region().map(UserRegion::strapiValue).ifPresent(value -> payload.put("region", value));
		payload.put("publishMyData", shouldPublishMyData(member));

		if (includePassword) {
			payload.put(
				"password",
				config.strapi().defaultPassword().formatted(member.cId())
			);
		}
		return payload;
	}

	static boolean shouldPublishMyData(Member member) {
		if (member.isBreeder()) {
			return true;
		}
		return member.publishMyData().orElse(false);
	}

	static Map<String, Object> toBreederInput(
		int breederCId,
		Optional<String> kennelName,
		boolean includeRole,
		Optional<Boolean> isActiveBreeder,
		Optional<String> memberDocumentId
	) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("cId", breederCId);
		isActiveBreeder.ifPresent(v -> payload.put("IsActive", v.booleanValue()));
		if (includeRole) {
			payload.put("BreederRole", "B");
		}
		kennelName.ifPresent(value -> payload.put("kennelName", value));
		memberDocumentId.ifPresent(documentId -> {
			payload.put("member", Map.of("connect", java.util.List.of(documentId)));
			payload.put("owner_members", Map.of("connect", java.util.List.of(documentId)));
		});
		return payload;
	}

	/** Deckrüden-Zwinger: Rolle S, member leer, owner_members = Besitzer des Hundes. */
	static Map<String, Object> toStudBreederInput(
		int breederCId,
		Optional<String> ownerMemberDocumentId,
		Optional<String> kennelName
	) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("cId", breederCId);
		payload.put("IsActive", true);
		payload.put("BreederRole", "S");
		kennelName
			.map(value -> truncate(value, 200))
			.ifPresent(value -> payload.put("kennelName", "DRB "+value));
		ownerMemberDocumentId.ifPresent(documentId ->
			payload.put("owner_members", Map.of("connect", java.util.List.of(documentId)))
		);
		return payload;
	}

	static Optional<String> formatOwnerKennelName(
		Optional<String> firstName,
		Optional<String> lastName
	) {
		String first = firstName.map(String::trim).filter(value -> !value.isEmpty()).orElse("");
		String last = lastName.map(String::trim).filter(value -> !value.isEmpty()).orElse("");
		String combined = (first + " " + last).trim();
		return combined.isEmpty() ? Optional.empty() : Optional.of(combined);
	}

	static Map<String, Object> toDogInput(Dog dog) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("cId", dog.cId());
		dog.givenName().ifPresent(value -> payload.put("givenName", truncate(value, 100)));
		dog.fullKennelName().ifPresent(value -> payload.put("fullKennelName", truncate(value, 500)));
		dog.breederId().ifPresent(value -> payload.put("cBreederId", value));
		dog.ownerId().ifPresent(value -> payload.put("cOwnerId", value));
		dog.chipNumber().ifPresent(value -> payload.put("microchipNo", truncate(value, 30)));
		dog.sex().ifPresent(value -> payload.put("sex", value.name()));
		dog.dateOfBirth().ifPresent(value -> payload.put("dateOfBirth", value.toString()));
		dog.dateOfDeath().ifPresent(value -> payload.put("dateOfDeath", value.toString()));
		dog.cFertile().ifPresent(value -> payload.put("cFertile", value));
		dog.hd().ifPresent(value -> payload.put("HD", value.name()));
		dog.sod1().ifPresent(value -> payload.put("SOD1", value.name()));
		dog.heartCheck().ifPresent(value -> payload.put("HeartCheck", value));
		dog.eyesCheck().ifPresent(value -> payload.put("EyesCheck", value));
		dog.genprofil().ifPresent(value -> payload.put("Genprofil", value));
		dog.color().ifPresent(value -> payload.put("color", value.name()));
		dog.studbookNumber().ifPresent(value -> payload.put("cStudBookNumber", value));
		dog.studbookNumberFather().ifPresent(value -> payload.put("cStudBookNumberFather", value));
		dog.studbookNumberMother().ifPresent(value -> payload.put("cStudBookNumberMother", value));
		dog.exhibitions().ifPresent(value -> payload.put("Exhibitions", value));
		dog.breedSurvey().ifPresent(value -> payload.put("BreedSurvey", value));
		return payload;
	}

	private static String truncateZip(String zip) {
		return truncate(zip, 5);
	}

	private static String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}
}
