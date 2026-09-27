package de.hzd.importer.application;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.Member;
import de.hzd.importer.domain.UserRegion;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

public final class CsvSnapshotDiffer {

	public enum Action {
		NEW,
		CHANGED,
		UNCHANGED,
		REMOVED
	}

	public record Field(
		String name,
		String previousValue,
		String csvValue,
		boolean different
	) {
	}

	public record Row(
		int cId,
		String label,
		Action action,
		List<Field> fields
	) {
	}

	public record Result(
		List<Row> rows,
		int changedCount,
		int newCount,
		int removedCount
	) {
	}

	private CsvSnapshotDiffer() {
	}

	public static Result compareMembers(List<Member> previous, List<Member> current) {
		return compare(
			index(previous, Member::cId),
			index(current, Member::cId),
			CsvSnapshotDiffer::memberLabel,
			CsvSnapshotDiffer::memberFields
		);
	}

	public static Set<Integer> cIdsToSync(Result result) {
		Set<Integer> cIds = new LinkedHashSet<>();
		if (result == null) {
			return cIds;
		}
		for (Row row : result.rows()) {
			if (row.action() == Action.NEW || row.action() == Action.CHANGED) {
				cIds.add(row.cId());
			}
		}
		return cIds;
	}

	public static Result compareDogs(List<Dog> previous, List<Dog> current) {
		return compare(
			index(previous, Dog::cId),
			index(current, Dog::cId),
			CsvSnapshotDiffer::dogLabel,
			CsvSnapshotDiffer::dogFields
		);
	}

	private static <T> Result compare(
		Map<Integer, T> previous,
		Map<Integer, T> current,
		Function<T, String> label,
		java.util.function.BiFunction<T, T, List<Field>> fields
	) {
		List<Row> rows = new ArrayList<>();
		int changed = 0;
		int created = 0;
		for (Map.Entry<Integer, T> entry : current.entrySet()) {
			T csv = entry.getValue();
			T stored = previous.get(entry.getKey());
			if (stored == null) {
				created++;
				rows.add(new Row(
					entry.getKey(),
					label.apply(csv),
					Action.NEW,
					withoutDifferences(fields.apply(null, csv))
				));
				continue;
			}
			List<Field> compared = fields.apply(stored, csv);
			boolean different = compared.stream().anyMatch(Field::different);
			if (different) {
				changed++;
			}
			rows.add(new Row(
				entry.getKey(),
				label.apply(csv),
				different ? Action.CHANGED : Action.UNCHANGED,
				compared
			));
		}
		int removed = 0;
		for (Map.Entry<Integer, T> entry : previous.entrySet()) {
			if (current.containsKey(entry.getKey())) {
				continue;
			}
			removed++;
			rows.add(new Row(
				entry.getKey(),
				label.apply(entry.getValue()),
				Action.REMOVED,
				withoutDifferences(fields.apply(entry.getValue(), null))
			));
		}
		return new Result(List.copyOf(rows), changed, created, removed);
	}

	private static List<Field> withoutDifferences(List<Field> fields) {
		return fields.stream()
			.map(field -> new Field(field.name(), field.previousValue(), field.csvValue(), false))
			.toList();
	}

	private static <T> Map<Integer, T> index(List<T> rows, Function<T, Integer> cId) {
		Map<Integer, T> indexed = new LinkedHashMap<>();
		if (rows == null) {
			return indexed;
		}
		for (T row : rows) {
			indexed.put(cId.apply(row), row);
		}
		return indexed;
	}

	private static String memberLabel(Member member) {
		return member.displayName().orElse(member.username());
	}

	private static String dogLabel(Dog dog) {
		return dog.givenName().or(dog::fullKennelName).orElse("");
	}

	private static List<Field> memberFields(Member previous, Member current) {
		List<Field> fields = new ArrayList<>();
		add(fields, "Zugang", bool(previous, Member::cFlagAccess), bool(current, Member::cFlagAccess));
		add(fields, "Titel", text(previous, Member::title), text(current, Member::title));
		add(fields, "Vorname", text(previous, Member::firstName), text(current, Member::firstName));
		add(fields, "Nachname", text(previous, Member::lastName), text(current, Member::lastName));
		add(fields, "Straße", text(previous, Member::address1), text(current, Member::address1));
		add(fields, "PLZ", text(previous, Member::zip), text(current, Member::zip));
		add(fields, "Ort", text(previous, Member::city), text(current, Member::city));
		add(fields, "Region", region(previous), region(current));
		add(fields, "Land", text(previous, Member::countryCode), text(current, Member::countryCode));
		add(fields, "Telefon", text(previous, Member::phone), text(current, Member::phone));
		add(fields, "E-Mail", text(previous, Member::email), text(current, Member::email));
		add(fields, "Anrede", enumName(previous, Member::sex), enumName(current, Member::sex));
		add(fields, "Züchter", bool(previous, Member::cFlagBreeder), bool(current, Member::cFlagBreeder));
		add(fields, "Mitgliedsnummer", number(previous, Member::membershipNumber), number(current, Member::membershipNumber));
		add(fields, "Zwinger", text(previous, Member::breedingStation), text(current, Member::breedingStation));
		add(fields, "Geburtsdatum", date(previous, Member::dateOfBirth), date(current, Member::dateOfBirth));
		add(fields, "Sterbedatum", date(previous, Member::dateOfDeath), date(current, Member::dateOfDeath));
		add(fields, "Eintritt", date(previous, Member::memberSince), date(current, Member::memberSince));
		add(fields, "Austritt", date(previous, Member::cancellationOn), date(current, Member::cancellationOn));
		add(fields, "Aktiver Züchter", bool(previous, Member::isActiveBreeder), bool(current, Member::isActiveBreeder));
		return List.copyOf(fields);
	}

	private static List<Field> dogFields(Dog previous, Dog current) {
		List<Field> fields = new ArrayList<>();
		add(fields, "Rufname", text(previous, Dog::givenName), text(current, Dog::givenName));
		add(fields, "Name", text(previous, Dog::fullKennelName), text(current, Dog::fullKennelName));
		add(fields, "Züchter-ID", number(previous, Dog::breederId), number(current, Dog::breederId));
		add(fields, "Besitzer-ID", number(previous, Dog::ownerId), number(current, Dog::ownerId));
		add(fields, "Chip", text(previous, Dog::chipNumber), text(current, Dog::chipNumber));
		add(fields, "Geschlecht", enumName(previous, Dog::sex), enumName(current, Dog::sex));
		add(fields, "Geburtsdatum", date(previous, Dog::dateOfBirth), date(current, Dog::dateOfBirth));
		add(fields, "Sterbedatum", date(previous, Dog::dateOfDeath), date(current, Dog::dateOfDeath));
		add(fields, "Zuchttauglich", bool(previous, Dog::cFertile), bool(current, Dog::cFertile));
		add(fields, "HD", enumName(previous, Dog::hd), enumName(current, Dog::hd));
		add(fields, "SOD1", enumName(previous, Dog::sod1), enumName(current, Dog::sod1));
		add(fields, "Herz", bool(previous, Dog::heartCheck), bool(current, Dog::heartCheck));
		add(fields, "Augen", bool(previous, Dog::eyesCheck), bool(current, Dog::eyesCheck));
		add(fields, "Genprofil", bool(previous, Dog::genprofil), bool(current, Dog::genprofil));
		add(fields, "Farbe", enumName(previous, Dog::color), enumName(current, Dog::color));
		add(fields, "Zuchtbuch", text(previous, Dog::studbookNumber), text(current, Dog::studbookNumber));
		add(fields, "Vater", text(previous, Dog::studbookNumberFather), text(current, Dog::studbookNumberFather));
		add(fields, "Mutter", text(previous, Dog::studbookNumberMother), text(current, Dog::studbookNumberMother));
		add(fields, "Ausstellungen", text(previous, Dog::exhibitions), text(current, Dog::exhibitions));
		add(fields, "Körung", text(previous, Dog::breedSurvey), text(current, Dog::breedSurvey));
		add(fields, "Zwinger", text(previous, Dog::breederKennelName), text(current, Dog::breederKennelName));
		return List.copyOf(fields);
	}

	private static void add(List<Field> fields, String name, String previous, String current) {
		fields.add(new Field(name, previous, current, !previous.equals(current)));
	}

	private static <T> String text(T row, Function<T, Optional<String>> reader) {
		if (row == null) {
			return "";
		}
		return reader.apply(row).map(String::trim).orElse("");
	}

	private static <T> String bool(T row, Function<T, Optional<Boolean>> reader) {
		if (row == null) {
			return "";
		}
		return reader.apply(row).map(String::valueOf).orElse("");
	}

	private static <T> String number(T row, Function<T, Optional<Integer>> reader) {
		if (row == null) {
			return "";
		}
		return reader.apply(row).map(String::valueOf).orElse("");
	}

	private static <T> String date(T row, Function<T, Optional<LocalDate>> reader) {
		if (row == null) {
			return "";
		}
		return reader.apply(row).map(LocalDate::toString).orElse("");
	}

	private static <T, E extends Enum<E>> String enumName(T row, Function<T, Optional<E>> reader) {
		if (row == null) {
			return "";
		}
		return reader.apply(row).map(Enum::name).orElse("");
	}

	private static String region(Member member) {
		if (member == null) {
			return "";
		}
		return member.region().map(UserRegion::strapiValue).orElse("");
	}
}
