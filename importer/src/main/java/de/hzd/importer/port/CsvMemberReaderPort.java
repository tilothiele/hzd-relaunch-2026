package de.hzd.importer.port;

import de.hzd.importer.domain.Member;
import java.nio.file.Path;
import java.util.List;

public interface CsvMemberReaderPort {
	List<Member> read(Path filePath);
}
