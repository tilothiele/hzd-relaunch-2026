package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.port.CsvDogReaderPort;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;

@ApplicationScoped
public class CsvDogReader implements CsvDogReaderPort {

    @Override
    public List<Dog> readDogs(Path csvPath) {
        List<Dog> dogs = new ArrayList<>();

        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                 .setHeader()
                 .setSkipHeaderRecord(true)
                 .setIgnoreEmptyLines(true)
                 .setTrim(true)
                 .build()
                 .parse(Files.newBufferedReader(csvPath))) {

            for (var record : parser) {
                try {
                    Dog dog = DogCsvMapper.mapRow(record.toMap());
                    dogs.add(dog);
                } catch (Exception e) {
                    System.err.println("Warning: Could not parse dog row: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new CsvReadException("Failed to read dogs CSV: " + csvPath, e);
        }

        return dogs;
    }
}
