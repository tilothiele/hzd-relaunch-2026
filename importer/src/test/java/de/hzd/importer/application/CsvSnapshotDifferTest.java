package de.hzd.importer.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.application.CsvSnapshotDiffer.Action;
import de.hzd.importer.application.CsvSnapshotDiffer.Field;
import de.hzd.importer.application.CsvSnapshotDiffer.Result;
import de.hzd.importer.application.CsvSnapshotDiffer.Row;
import de.hzd.importer.domain.Member;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CsvSnapshotDifferTest {

	@Test
	void countsChangedAndNewMembersByCId() {
		Member stored = member(1, "Berlin");
		Member changed = member(1, "Hamburg");
		Member created = member(2, "Kiel");

		Result result = CsvSnapshotDiffer.compareMembers(List.of(stored), List.of(changed, created));

		assertEquals(1, result.changedCount());
		assertEquals(1, result.newCount());
		assertEquals(0, result.removedCount());

		Row updated = row(result, 1);
		assertEquals(Action.CHANGED, updated.action());
		Field city = field(updated, "Ort");
		assertTrue(city.different());
		assertEquals("Berlin", city.previousValue());
		assertEquals("Hamburg", city.csvValue());

		Row inserted = row(result, 2);
		assertEquals(Action.NEW, inserted.action());
		assertFalse(field(inserted, "Ort").different());
	}

	@Test
	void syncsOnlyNewAndChangedCIds() {
		Member stored = member(1, "Berlin");
		Member unchanged = member(1, "Berlin");
		Member changed = member(2, "Hamburg");
		Member created = member(3, "Kiel");

		CsvSnapshotDiffer.Result result = CsvSnapshotDiffer.compareMembers(
			List.of(stored, member(2, "Bremen")),
			List.of(unchanged, changed, created)
		);

		assertEquals(Set.of(2, 3), CsvSnapshotDiffer.cIdsToSync(result));
	}

	@Test
	void countsRemovedMembers() {
		Result result = CsvSnapshotDiffer.compareMembers(
			List.of(member(4, "Bonn")),
			List.of()
		);

		assertEquals(1, result.removedCount());
		assertEquals(Action.REMOVED, row(result, 4).action());
	}

	private static Member member(int cId, String city) {
		return new Member(
			cId,
			Optional.empty(),
			Optional.empty(),
			Optional.of("Lena"),
			Optional.of("Beispiel"),
			Optional.empty(),
			Optional.empty(),
			Optional.of(city),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.of(LocalDate.parse("2000-01-01")),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);
	}

	private static Row row(Result result, int cId) {
		return result.rows().stream().filter(row -> row.cId() == cId).findFirst().orElseThrow();
	}

	private static Field field(Row row, String name) {
		return row.fields().stream().filter(field -> field.name().equals(name)).findFirst().orElseThrow();
	}
}
