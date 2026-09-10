package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.hzd.importer.adapter.strapi.StrapiDogAdapter.StrapiDogSnapshot;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class StrapiDogSnapshotTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void readsDogFromFlatJson() throws Exception {
		JsonNode item = objectMapper.readTree("""
			{
				"id": 9,
				"documentId": "dog-doc-1",
				"cId": 23824,
				"givenName": "Do It Again",
				"fullKennelName": "Enormous Do It Again",
				"cBreederId": 7402,
				"cOwnerId": 10745,
				"microchipNo": "616093901903935",
				"sex": "F",
				"dateOfBirth": "2022-05-24",
				"cFertile": true,
				"HD": "B1",
				"SOD1": "N_N",
				"HeartCheck": true,
				"EyesCheck": true,
				"Genprofil": true,
				"color": "B",
				"cStudBookNumber": "PKR.II-156446",
				"BreedSurvey": "Verhalten III"
			}
			""");

		StrapiDogSnapshot dog = StrapiDogSnapshot.fromJson(item).orElseThrow();

		assertEquals("dog-doc-1", dog.documentId());
		assertEquals(9, dog.id());
		assertEquals(23824, dog.cId());
		assertEquals("Do It Again", dog.givenName().orElseThrow());
		assertEquals(DogSex.F, dog.sex().orElseThrow());
		assertEquals(LocalDate.of(2022, 5, 24), dog.dateOfBirth().orElseThrow());
		assertEquals(DogHd.B1, dog.hd().orElseThrow());
		assertEquals(DogSod1.N_N, dog.sod1().orElseThrow());
		assertEquals(DogColor.B, dog.color().orElseThrow());
		assertEquals(Optional.of(true), dog.cFertile());
		assertEquals("Verhalten III", dog.breedSurvey().orElseThrow());
	}

	@Test
	void readsDogFromDataWrapper() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"data": {
					"documentId": "dog-doc-2",
					"cId": 1,
					"givenName": "Bo"
				}
			}
			""");

		StrapiDogSnapshot dog = StrapiDogSnapshot.fromJson(response).orElseThrow();
		assertEquals("dog-doc-2", dog.documentId());
		assertEquals(1, dog.cId());
		assertEquals("Bo", dog.givenName().orElseThrow());
	}

	@Test
	void cachesFullDogSnapshotByCid() {
		StrapiDogAdapter adapter = new StrapiDogAdapter();
		StrapiDogSnapshot snapshot = new StrapiDogSnapshot(
			"dog-doc-1",
			9,
			23824,
			Optional.of("Do It Again"),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty()
		);

		adapter.setImportCache(List.of(snapshot));

		assertEquals(snapshot, adapter.getCachedDogByCid(23824));
		assertNull(adapter.getCachedDogByCid(1));
		assertTrue(adapter.getCachedDogByCid(23824).givenName().orElse("").contains("Do It"));
	}
}
