package de.hzd.importer.adapter.csv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.Member;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class CsvMemberReaderTest {

	@Test
	void readsMembersFromCsv() {
		CsvMemberReader reader = new CsvMemberReader();
		List<Member> members = reader.read(Path.of("src/test/resources/members.csv"));
		assertEquals(1, members.size());
		Member member = members.get(0);
		assertEquals(10927, member.cId());
		assertEquals("Lena", member.firstName().orElseThrow());
		assertEquals("Babel", member.lastName().orElseThrow());
		assertEquals("hzd.152544", member.username());
		assertTrue(member.email().orElse("").contains("lena@example.de"));
	}
}
