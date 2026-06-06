package de.hzd.importer.adapter.csv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.domain.UserSex;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class CsvParsingUtilsTest {

	@Test
	void parseDateSupportsChromosoftFormat() {
		Optional<LocalDate> date = CsvParsingUtils.parseDate("29/08/1989");
		assertEquals(LocalDate.of(1989, 8, 29), date.orElseThrow());
	}

	@Test
	void parseSexMapsSalutation() {
		assertEquals(Optional.of(UserSex.F), CsvParsingUtils.parseSex("Frau"));
		assertEquals(Optional.of(UserSex.M), CsvParsingUtils.parseSex("Herr"));
	}

	@Test
	void parseRegionMapsSued() {
		assertEquals(Optional.of(UserRegion.Sued), CsvParsingUtils.parseRegion("Süd"));
	}

	@Test
	void parseDogEnums() {
		assertEquals(Optional.of(DogSex.F), CsvParsingUtils.parseDogSex("Hündin"));
		assertEquals(Optional.of(DogHd.B1), CsvParsingUtils.parseHd("B1(G)"));
		assertEquals(Optional.of(DogSod1.N_N), CsvParsingUtils.parseSod1("N/N"));
		assertEquals(Optional.of(DogColor.B), CsvParsingUtils.parseColor("blond"));
	}

	@Test
	void treatsDashAsEmptyCellValue() {
		assertTrue(CsvParsingUtils.isEmptyCellValue("-"));
		assertTrue(CsvParsingUtils.isEmptyCellValue(" - "));
		assertEquals("", CsvParsingUtils.normalizeCellValue("-"));
	}

	@Test
	void treatsDashOnlyRowAsBlank() {
		assertTrue(CsvParsingUtils.isBlankRow(Map.of(
			"ID Person", "-",
			"firstname", "-",
			"email", "-"
		)));
	}

	@Test
	void validatesEmailSyntax() {
		assertTrue(CsvParsingUtils.isValidEmailSyntax("lena@example.de"));
		assertTrue(CsvParsingUtils.isValidEmailSyntax("t.thiele@hovawarte.com"));
		assertTrue(CsvParsingUtils.isValidEmailSyntax("b.becker@becker-online.de"));

		assertFalse(CsvParsingUtils.isValidEmailSyntax("invalid"));
		assertFalse(CsvParsingUtils.isValidEmailSyntax("a@b"));
		assertFalse(CsvParsingUtils.isValidEmailSyntax("@example.de"));
		assertFalse(CsvParsingUtils.isValidEmailSyntax("a@"));
		assertFalse(CsvParsingUtils.isValidEmailSyntax("b.becker@becker-a-b-.de"));
		assertFalse(CsvParsingUtils.isValidEmailSyntax("hovawarte@kleinestrohe.de."));
	}

	@Test
	void parseMemberEmailRejectsInvalidAddress() {
		assertTrue(CsvParsingUtils.parseMemberEmail("not-an-email", 10927, "testuser").isEmpty());
		assertTrue(CsvParsingUtils.parseMemberEmail("b.becker@becker---.de", 10927, "testuser").isEmpty());
		assertTrue(CsvParsingUtils.parseMemberEmail("hovawarte@kleinestrohe.de.", 10927, "testuser").isEmpty());
	}

	@Test
	void parseMemberEmailAcceptsValidAddress() {
		assertEquals(
			Optional.of("lena@example.de"),
			CsvParsingUtils.parseMemberEmail("lena@example.de", 10927, "testuser")
		);
	}

	@Test
	void parseMemberEmailTreatsEmptyAsMissing() {
		assertTrue(CsvParsingUtils.parseMemberEmail("-", 10927, "testuser").isEmpty());
		assertTrue(CsvParsingUtils.parseMemberEmail("", 10927, "testuser").isEmpty());
	}

	@Test
	void parseHealthCheckTreatsObAsTrue() {
		assertTrue(CsvParsingUtils.parseHealthCheck("o. B.").orElse(false));
	}
}
