package de.hzd.importer.port;

import de.hzd.importer.domain.Dog;
import java.nio.file.Path;
import java.util.List;

public interface CsvDogReaderPort {
	List<Dog> read(Path filePath);
}
