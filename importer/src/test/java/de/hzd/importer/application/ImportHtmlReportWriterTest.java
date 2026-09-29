package de.hzd.importer.application;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.application.CsvSnapshotDiffer.Action;
import de.hzd.importer.application.CsvSnapshotDiffer.Field;
import de.hzd.importer.application.CsvSnapshotDiffer.Result;
import de.hzd.importer.application.CsvSnapshotDiffer.Row;
import de.hzd.importer.domain.ImportJob;
import de.hzd.importer.domain.ImportJobStatus;
import de.hzd.importer.domain.ImportStatistics;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ImportHtmlReportWriterTest {

	@TempDir
	Path tempDir;

	@Test
	void marksNewRowsYellowAndChangedCellsRed() throws Exception {
		Result members = new Result(List.of(
			new Row(12, "Lena Beispiel", Action.CHANGED, List.of(
				new Field("Ort", "Berlin", "Hamburg", true)
			)),
			new Row(13, "Unverändert", Action.UNCHANGED, List.of(
				new Field("Ort", "Bonn", "Bonn", false)
			)),
			new Row(14, "Entfernt", Action.REMOVED, List.of(
				new Field("Ort", "Köln", "", false)
			))
		), 1, 0, 1);
		Result dogs = new Result(List.of(
			new Row(44, "Bo", Action.NEW, List.of(
				new Field("Rufname", "", "Bo", false)
			))
		), 0, 1, 0);
		ImportJob job = new ImportJob(
			UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
			ImportJobStatus.SUCCESS,
			Instant.parse("2026-09-27T18:00:00Z"),
			Instant.parse("2026-09-27T18:05:00Z"),
			"ok",
			ImportStatistics.empty()
		);

		String html = new ImportHtmlReportWriter().render(job.id(), job, members, dogs);

		assertTrue(html.contains("<h2>Mitglieder</h2>"));
		assertTrue(html.contains("<h2>Hunde</h2>"));
		assertTrue(html.contains("class=\"inserted\""));
		assertTrue(html.contains("class=\"diff\">DB: Berlin<br>CSV: Hamburg"));
		assertTrue(html.contains(">Neu<"));
		assertFalse(html.contains("Unverändert"));
		assertFalse(html.contains(">Entfernt<"));
		assertFalse(html.contains("<script>"));

		Path file = new ImportHtmlReportWriter().writeTo(tempDir, job.id(), job, members, dogs, 7);
		assertTrue(Files.exists(file));

		Path expired = tempDir.resolve("import-old.html");
		Files.writeString(expired, "<html></html>");
		Files.setLastModifiedTime(expired, FileTime.from(Instant.now().minus(30, ChronoUnit.DAYS)));
		new ImportHtmlReportWriter().writeTo(tempDir, job.id(), job, members, dogs, 7);
		assertFalse(Files.exists(expired));
	}

	@Test
	void notesSkippedSectionWhenBaselineWasEmpty() {
		String html = new ImportHtmlReportWriter().render(
			UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
			null,
			null,
			new Result(List.of(), 0, 0, 0)
		);

		assertTrue(html.contains("Plausibilitätsprüfung übersprungen, die Tabelle war leer."));
		assertTrue(html.contains("<h2>Hunde</h2>"));
	}
}
