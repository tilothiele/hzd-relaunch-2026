package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.Dog;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

final class DogCsvMapper {

	private DogCsvMapper() {
	}

	static Dog mapRow(Map<String, String> row) {
		int cId = CsvParsingUtils.parseInteger(row.get("ID Animal"))
			.orElseThrow(() -> new IllegalArgumentException("Missing ID Animal"));

		String hdValue = Optional.ofNullable(row.get("HD(G)"))
			.filter(value -> !value.isBlank())
			.orElse(row.get("HD"));

		return new Dog(
			cId,
			CsvParsingUtils.cleanString(row.get("Given Name"), null),
			CsvParsingUtils.cleanString(row.get("Full Name"), null),
			CsvParsingUtils.parseInteger(row.get("ID Breeder")),
			CsvParsingUtils.parseInteger(row.get("ID Owner")),
			CsvParsingUtils.cleanString(row.get("chip number"), null),
			CsvParsingUtils.parseDogSex(row.get("sex")),
			CsvParsingUtils.parseDate(row.get("date of birth")),
			CsvParsingUtils.parseDate(row.get("date of death")),
			CsvParsingUtils.parseBoolean(row.get("fertile")),
			CsvParsingUtils.parseHd(hdValue),
			CsvParsingUtils.parseSod1(row.get("Gentest SOD1")),
			CsvParsingUtils.parseHealthCheck(row.get("Herzuntersuchung")),
			CsvParsingUtils.parseHealthCheck(row.get("Augenuntersuchung")),
			CsvParsingUtils.parseGenprofil(row.get("DNA-Profil")),
			CsvParsingUtils.parseColor(row.get("color")),
			CsvParsingUtils.cleanString(row.get("studbook number"), null),
			CsvParsingUtils.cleanString(row.get("studbook number (sire)"), null),
			CsvParsingUtils.cleanString(row.get("studbook number (dam)"), null),
			CsvParsingUtils.cleanString(row.get("Richterbericht"), null),
			buildBreedSurvey(row),
			resolveKennelName(row)
		);
	}

	private static Optional<String> resolveKennelName(Map<String, String> row) {
		for (String key : List.of(
			"Name of Breeding Station",
			"name of breeding station",
			"Name of breeder station",
			"name of breeder station"
		)) {
			Optional<String> value = CsvParsingUtils.cleanString(row.get(key), null);
			if (value.isPresent()) {
				return value;
			}
		}
		for (Map.Entry<String, String> entry : row.entrySet()) {
			if (entry.getKey() == null) {
				continue;
			}
			String key = entry.getKey().trim().toLowerCase(Locale.ROOT);
			if ("name of breeding station".equals(key) || "name of breeder station".equals(key)) {
				Optional<String> value = CsvParsingUtils.cleanString(entry.getValue(), null);
				if (value.isPresent()) {
					return value;
				}
			}
		}
		return Optional.empty();
	}

	private static Optional<String> buildBreedSurvey(Map<String, String> row) {
		List<String> parts = new ArrayList<>();
		for (Map.Entry<String, String> entry : row.entrySet()) {
			if (entry.getKey() == null || entry.getValue() == null) {
				continue;
			}
			String key = entry.getKey().trim().toLowerCase(Locale.ROOT);
			String value = entry.getValue().trim();
			if (value.isBlank()) {
				continue;
			}
			if (key.startsWith("verhalten") || key.startsWith("körung")) {
				parts.add(value);
			}
		}
		if (parts.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(String.join("\n", parts));
	}
}
