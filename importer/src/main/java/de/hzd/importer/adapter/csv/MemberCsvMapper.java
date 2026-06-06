package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.Member;
import java.util.Map;
import java.util.Optional;

final class MemberCsvMapper {

	private MemberCsvMapper() {
	}

	private static String toFullName(Optional<String> firstName, Optional<String> lastName) {
		return firstName.orElse("")+" "+lastName.orElse("");
	}
	
	static Member mapRow(Map<String, String> row) {
		int cId = CsvParsingUtils.parseInteger(row.get("ID Person"))
			.orElseThrow(() -> new IllegalArgumentException("Missing ID Person"));

		Optional<String> phone = CsvParsingUtils.cleanString(row.get("mobile"), 50);
		if (phone.isEmpty()) {
			phone = CsvParsingUtils.cleanString(row.get("phone"), 50);
		}

		Optional<String> firstName = CsvParsingUtils.cleanString(row.get("firstname"), null);
		Optional<String> lastName = CsvParsingUtils.cleanString(row.get("lastname"), null);
		String fullName = toFullName(firstName, lastName);
		return new Member(
			cId,
			CsvParsingUtils.parseBoolean(row.get("0/1 access")),
			CsvParsingUtils.cleanString(row.get("title"), null),
			firstName,
			lastName,
			CsvParsingUtils.cleanString(row.get("street"), 100),
			CsvParsingUtils.cleanString(row.get("zipcode"), 10),
			CsvParsingUtils.cleanString(row.get("city"), null),
			CsvParsingUtils.parseRegion(row.get("oblast")),
			CsvParsingUtils.parseCountryCode(row.get("country")),
			phone,
			CsvParsingUtils.parseMemberEmail(row.get("email"), cId, fullName),
			CsvParsingUtils.parseSex(row.get("salutation")),
			CsvParsingUtils.parseBoolean(row.get("person is a breeder")),
			CsvParsingUtils.parseInteger(row.get("membership number")),
			CsvParsingUtils.cleanString(row.get("breeding station"), 200),
			CsvParsingUtils.parseDate(row.get("date of birth")),
			CsvParsingUtils.parseDate(row.get("date of death")),
			CsvParsingUtils.parseDate(row.get("date of joining")),
			CsvParsingUtils.parseDate(row.get("date of leaving")),
			CsvParsingUtils.parseBoolean(row.get("person is an active breeder")),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);
	}
}
