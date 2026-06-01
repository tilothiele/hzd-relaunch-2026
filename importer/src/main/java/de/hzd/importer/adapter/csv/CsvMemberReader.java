package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.Member;
import de.hzd.importer.port.CsvDogReaderPort;
import de.hzd.importer.port.CsvMemberReaderPort;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.jboss.logging.Logger;

@ApplicationScoped
public class CsvMemberReader implements CsvMemberReaderPort {

	private static final Logger LOG = Logger.getLogger(CsvMemberReader.class);

	@Override
	public List<Member> read(Path filePath) {
		return readRecords(filePath, row -> MemberCsvMapper.mapRow(row));
	}

	static <T> List<T> readRecords(Path filePath, RowMapper<T> mapper) {
		List<T> records = new ArrayList<>();
		try (Reader reader = Files.newBufferedReader(filePath, StandardCharsets.UTF_8);
			CSVParser parser = CSVFormat.DEFAULT.builder()
				.setHeader()
				.setSkipHeaderRecord(true)
				.setIgnoreEmptyLines(true)
				.setTrim(true)
				.setAllowMissingColumnNames(true)
				.get()
				.parse(reader)) {
			int rowNumber = 2;
			for (CSVRecord record : parser) {
				Map<String, String> row = CsvParsingUtils.normalizeRow(record.toMap());
				if (CsvParsingUtils.isBlankRow(row)) {
					rowNumber++;
					continue;
				}
				try {
					records.add(mapper.map(row));
				} catch (IllegalArgumentException exception) {
					LOG.warnf(
						exception,
						"Skipping invalid CSV row %d in %s: %s",
						rowNumber,
						filePath,
						exception.getMessage()
					);
				}
				rowNumber++;
			}
		} catch (IOException exception) {
			throw new CsvReadException("Failed to read CSV file: " + filePath, exception);
		}
		return records;
	}

	@FunctionalInterface
	interface RowMapper<T> {
		T map(Map<String, String> row);
	}
}

@ApplicationScoped
class CsvDogReader implements CsvDogReaderPort {

	private static final Logger LOG = Logger.getLogger(CsvDogReader.class);

	@Override
	public List<Dog> read(Path filePath) {
		return CsvMemberReader.readRecords(filePath, row -> DogCsvMapper.mapRow(row));
	}
}
