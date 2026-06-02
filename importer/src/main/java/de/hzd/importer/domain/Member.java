package de.hzd.importer.domain;

import java.time.LocalDate;
import java.util.Optional;

public record Member(
		int cId,
		Optional<Boolean> cFlagAccess,
		Optional<String> title,
		Optional<String> firstName,
		Optional<String> lastName,
		Optional<String> address1,
		Optional<String> zip,
		Optional<String> city,
		Optional<UserRegion> region,
		Optional<String> countryCode,
		Optional<String> phone,
		Optional<String> email,
		Optional<UserSex> sex,
		Optional<Boolean> cFlagBreeder,
		Optional<Integer> membershipNumber,
		Optional<String> breedingStation,
		Optional<LocalDate> dateOfBirth,
		Optional<LocalDate> dateOfDeath,
		Optional<LocalDate> memberSince,
		Optional<LocalDate> cancellationOn,
		Optional<Boolean> publishMyData,
		String documentId,
		int id
) {
	public static final String UNDEFINED_DOCUMENT_ID = "";
	public static final int UNDEFINED_ID = 0;

	public String username() {
		String cUsername = "c."+cId;
		if(cFlagBreeder.orElse(Boolean.FALSE)) return cUsername;
		if(membershipNumber!=null && !membershipNumber.isEmpty()) return ""+membershipNumber.get();
		return cUsername;
	}

	public String strapiEmail() {
		return "c."+cId + "@hovawarte.com";
	}
	
	public String authentikEmail() {
		return cEmail().orElse(email().orElse(strapiEmail()));
	}

	public Optional<String> cEmail() {
		return email().filter(value -> value.contains("@"));
	}

	public Optional<String> displayName() {
		String first = firstName.orElse("");
		String last = lastName.orElse("");
		String combined = (first + " " + last).trim();
		return combined.isBlank() ? Optional.empty() : Optional.of(combined);
	}

	public boolean isBreeder() {
		return cFlagBreeder.orElse(false);
	}

	public boolean doImportInAuthentik() {
		return isActive() && membershipNumber.isPresent();
	}
	
	
	public boolean isActive() {
		if (cancellationOn.isPresent()) {
			return cancellationOn.get().isBefore(LocalDate.now());
		}
		if (dateOfDeath.isPresent()) {
			return true;
		}
//		if (cFlagAccess.isPresent()) {
//			return cFlagAccess.get();
//		}
		return !isBreeder();
	}

	public Member withStrapiIdentity(
		String documentId,
		int id,
		Optional<Boolean> publishMyData
	) {
		return new Member(
			cId,
			cFlagAccess,
			title,
			firstName,
			lastName,
			address1,
			zip,
			city,
			region,
			countryCode,
			phone,
			email,
			sex,
			cFlagBreeder,
			membershipNumber,
			breedingStation,
			dateOfBirth,
			dateOfDeath,
			memberSince,
			cancellationOn,
			publishMyData,
			documentId,
			id
		);
	}

	public boolean hasStrapiIdentity() {
		return id != UNDEFINED_ID && !documentId.isBlank();
	}
}
