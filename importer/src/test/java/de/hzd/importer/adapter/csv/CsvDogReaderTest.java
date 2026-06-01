package de.hzd.importer.adapter.csv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogSex;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class CsvDogReaderTest {

	@Test
	void readsDogsFromCsv() {
		CsvDogReader reader = new CsvDogReader();
		List<Dog> dogs = reader.read(Path.of("src/test/resources/dogs.csv"));
		assertEquals(1, dogs.size());
		Dog dog = dogs.get(0);
		assertEquals(23824, dog.cId());
		assertEquals("Do It Again", dog.givenName().orElseThrow());
		assertEquals(DogSex.F, dog.sex().orElseThrow());
		assertEquals(DogColor.B, dog.color().orElseThrow());
		assertTrue(dog.breedSurvey().orElse("").contains("Verhalten III"));
	}
}
