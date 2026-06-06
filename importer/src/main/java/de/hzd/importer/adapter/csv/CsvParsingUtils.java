package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.domain.UserSex;
import io.quarkus.logging.Log;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

final class CsvParsingUtils {

	private static final Pattern NON_DIGIT = Pattern.compile("[^\\d-]");
	private static final Pattern DOMAIN_LABEL = Pattern.compile("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$");
	private static final Pattern EMAIL_LOCAL_PART = Pattern.compile(
		"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$"
	);
	private static final Map<String, UserRegion> REGION_MAPPING = Map.of(
		"Nord", UserRegion.Nord,
		"Süd", UserRegion.Sued,
		"Sued", UserRegion.Sued,
		"Ost", UserRegion.Ost,
		"West", UserRegion.West,
		"Mitte", UserRegion.Mitte
	);
	private static final Map<String, String> COUNTRY_CODES = Map.of(
		"Deutschland", "DE",
		"Germany", "DE",
		"Österreich", "AT",
		"Austria", "AT",
		"Schweiz", "CH",
		"Switzerland", "CH"
	);

	private CsvParsingUtils() {
	}

	static Map<String, String> normalizeRow(Map<String, String> row) {
		Map<String, String> normalized = new LinkedHashMap<>();
		row.forEach((key, value) -> normalized.put(key, normalizeCellValue(value)));
		return normalized;
	}

	static String normalizeCellValue(String value) {
		if (value == null) {
			return "";
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty() || "-".equals(trimmed)) {
			return "";
		}
		return trimmed;
	}

	static boolean isEmptyCellValue(String value) {
		if (value == null) {
			return true;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() || "-".equals(trimmed);
	}

	static Optional<String> cleanString(String value, Integer maxLength) {
		if (isEmptyCellValue(value)) {
			return Optional.empty();
		}
		String cleaned = value.trim();
		if (maxLength != null && cleaned.length() > maxLength) {
			cleaned = cleaned.substring(0, maxLength);
		}
		return Optional.of(cleaned);
	}

	static Optional<Integer> parseInteger(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		try {
			String digits = NON_DIGIT.matcher(cleaned.get()).replaceAll("");
			if (digits.isBlank()) {
				return Optional.empty();
			}
			return Optional.of(Integer.parseInt(digits));
		} catch (NumberFormatException exception) {
			return Optional.empty();
		}
	}

	static Optional<Boolean> parseBoolean(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return switch (cleaned.get()) {
			case "0", "false", "False", "FALSE" -> Optional.of(false);
			case "1", "true", "True", "TRUE" -> Optional.of(true);
			default -> Optional.empty();
		};
	}

	static Optional<LocalDate> parseDate(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		for (DateTimeFormatter formatter : new DateTimeFormatter[] {
			DateTimeFormatter.ofPattern("dd/MM/yyyy"),
			DateTimeFormatter.ofPattern("dd-MM-yyyy"),
			DateTimeFormatter.ofPattern("dd.MM.yyyy"),
			DateTimeFormatter.ISO_LOCAL_DATE
		}) {
			try {
				return Optional.of(LocalDate.parse(cleaned.get(), formatter));
			} catch (DateTimeParseException ignored) {
				// try next format
			}
		}
		return Optional.empty();
	}

	static Optional<UserSex> parseSex(String salutation) {
		Optional<String> cleaned = cleanString(salutation, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return switch (cleaned.get().toLowerCase(Locale.ROOT)) {
			case "herr", "mr", "mr.", "m" -> Optional.of(UserSex.M);
			case "frau", "mrs", "mrs.", "ms", "ms.", "f" -> Optional.of(UserSex.F);
			default -> Optional.empty();
		};
	}

	static Optional<String> parseEmail(String value) {
		Optional<String> cleaned = cleanString(value, 255);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return cleaned.filter(CsvParsingUtils::isValidEmailSyntax);
	}

	static Optional<String> parseMemberEmail(String value, int cId, String name) {
		Optional<String> cleaned = cleanString(value, 255);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		String email = cleaned.get();
		if (!isValidEmailSyntax(email)) {
			Log.infof("invalid email for name="+name+" cId=" + cId + ": " + email);
			return Optional.empty();
		}
		return Optional.of(email);
	}

	static boolean isValidEmailSyntax(String email) {
		if (email == null || email.isBlank()) {
			return false;
		}

		String trimmed = email.trim();
		if (trimmed.endsWith(".") || trimmed.contains("..") || trimmed.contains(" ")) {
			return false;
		}

		int atIndex = trimmed.lastIndexOf('@');
		if (atIndex <= 0 || atIndex == trimmed.length() - 1) {
			return false;
		}

		String localPart = trimmed.substring(0, atIndex);
		String domain = trimmed.substring(atIndex + 1);
		if (!EMAIL_LOCAL_PART.matcher(localPart).matches()) {
			return false;
		}

		return isValidEmailDomain(domain);
	}

	private static boolean isValidEmailDomain(String domain) {
		if (domain.isBlank() || domain.endsWith(".") || domain.startsWith(".")) {
			return false;
		}

		String[] labels = domain.split("\\.");
		if (labels.length < 2) {
			return false;
		}

		for (String label : labels) {
			if (!DOMAIN_LABEL.matcher(label).matches()) {
				return false;
			}
		}

		String topLevelDomain = labels[labels.length - 1];
		return topLevelDomain.length() >= 2 && topLevelDomain.chars().allMatch(Character::isLetter);
	}

	static Optional<Boolean> parseGenprofil(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(true);
	}

	static Optional<UserRegion> parseRegion(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return Optional.ofNullable(REGION_MAPPING.get(cleaned.get()));
	}

	static Optional<String> parseCountryCode(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		String country = cleaned.get();
		if (COUNTRY_CODES.containsKey(country)) {
			return Optional.of(COUNTRY_CODES.get(country));
		}
		if (country.length() >= 2) {
			return Optional.of(country.substring(0, 2).toUpperCase(Locale.ROOT));
		}
		return Optional.empty();
	}

	static Optional<DogSex> parseDogSex(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return switch (cleaned.get().toLowerCase(Locale.ROOT)) {
			case "hündin", "weiblich", "f", "female", "1" -> Optional.of(DogSex.F);
			case "rüde", "männlich", "m", "male", "0" -> Optional.of(DogSex.M);
			default -> Optional.empty();
		};
	}

	static Optional<DogHd> parseHd(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		String normalized = cleaned.get().replace("(G)", "").trim().toUpperCase(Locale.ROOT);
		try {
			return Optional.of(DogHd.valueOf(normalized));
		} catch (IllegalArgumentException exception) {
			return Optional.empty();
		}
	}

	static Optional<DogSod1> parseSod1(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return switch (cleaned.get().toUpperCase(Locale.ROOT)) {
			case "N/N" -> Optional.of(DogSod1.N_N);
			case "N/DM" -> Optional.of(DogSod1.N_DM);
			case "DM/DM" -> Optional.of(DogSod1.DM_DM);
			default -> Optional.empty();
		};
	}

	static Optional<DogColor> parseColor(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return switch (cleaned.get().toLowerCase(Locale.ROOT)) {
			case "schwarz" -> Optional.of(DogColor.S);
			case "schwarzmarken" -> Optional.of(DogColor.SM);
			case "blond" -> Optional.of(DogColor.B);
			default -> Optional.empty();
		};
	}

	static Optional<Boolean> parseHealthCheck(String value) {
		Optional<String> cleaned = cleanString(value, null);
		if (cleaned.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(true);
	}

	static boolean isBlankRow(Map<String, String> row) {
		return row.values().stream().allMatch(CsvParsingUtils::isEmptyCellValue);
	}
}
