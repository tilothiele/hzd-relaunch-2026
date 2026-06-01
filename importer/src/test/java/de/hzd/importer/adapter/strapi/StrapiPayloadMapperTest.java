package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import de.hzd.importer.domain.Member;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.domain.UserSex;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class StrapiPayloadMapperTest {

	private final ImporterConfig config = Mockito.mock(ImporterConfig.class);

	@Test
	void mapsUserFieldsToStrapiSchema() {
		Mockito.when(config.strapi()).thenReturn(new ImporterConfig.StrapiConfig() {
			@Override
			public String baseUrl() {
				return "http://localhost:1337/api";
			}

			@Override
			public Optional<String> apiToken() {
				return Optional.empty();
			}

			@Override
			public java.time.Duration httpTimeout() {
				return java.time.Duration.ofSeconds(30);
			}

			@Override
			public int pageSize() {
				return 100;
			}

			@Override
			public int maxRetries() {
				return 3;
			}

			@Override
			public java.time.Duration requestDelay() {
				return java.time.Duration.ofMillis(100);
			}

			@Override
			public String defaultPassword() {
				return "Import-%d-ChangeMe!";
			}

			@Override
			public Optional<Integer> authenticatedRoleId() {
				return Optional.empty();
			}
		});

		Member member = new Member(
			10927,
			Optional.of(false),
			Optional.of("Dr."),
			Optional.of("Lena"),
			Optional.of("Babel"),
			Optional.of("Brunnenweg 5"),
			Optional.of("51580"),
			Optional.of("Reichshof"),
			Optional.of(UserRegion.Sued),
			Optional.of("DE"),
			Optional.of("01602300683"),
			Optional.of("lena@example.de"),
			Optional.of(UserSex.F),
			Optional.of(false),
			Optional.of(152544),
			Optional.of("Enormous"),
			Optional.of(LocalDate.of(1989, 8, 29)),
			Optional.empty(),
			Optional.of(LocalDate.of(2026, 2, 23)),
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, true, 2);

		assertEquals("hzd.152544", payload.get("username"));
		assertEquals("lena@example.de", payload.get("email"));
		assertEquals("lena@example.de", payload.get("cEmail"));
		assertEquals("Süd", payload.get("region"));
		assertEquals("51580", payload.get("zip"));
		assertEquals("Import-10927-ChangeMe!", payload.get("password"));
		assertEquals(true, payload.get("confirmed"));
		assertEquals("local", payload.get("provider"));
		assertEquals(2, payload.get("role"));
	}

	@Test
	void mapsBreederUsernameFromCId() {
		mockStrapiConfig();
		Member member = breederMember(Optional.empty());

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, false, 2);

		assertEquals("hzd.10927", payload.get("username"));
		assertEquals(true, payload.get("publishMyData"));
	}

	@Test
	void preservesPublishMyDataFromMember() {
		mockStrapiConfig();
		Member member = breederMember(Optional.of(true));

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, false, 2);

		assertEquals(true, payload.get("publishMyData"));
	}

	@Test
	void forcesPublishMyDataForBreeder() {
		mockStrapiConfig();
		Member member = breederMember(Optional.of(false));

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, false, 2);

		assertEquals(true, payload.get("publishMyData"));
	}

	@Test
	void defaultsPublishMyDataToFalseWithoutSnapshot() {
		mockStrapiConfig();
		Member member = new Member(
			42,
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
			Optional.of(false),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, false, 2);

		assertEquals(false, payload.get("publishMyData"));
	}

	private void mockStrapiConfig() {
		Mockito.when(config.strapi()).thenReturn(new ImporterConfig.StrapiConfig() {
			@Override
			public String baseUrl() {
				return "http://localhost:1337/api";
			}

			@Override
			public Optional<String> apiToken() {
				return Optional.empty();
			}

			@Override
			public java.time.Duration httpTimeout() {
				return java.time.Duration.ofSeconds(30);
			}

			@Override
			public int pageSize() {
				return 100;
			}

			@Override
			public int maxRetries() {
				return 3;
			}

			@Override
			public java.time.Duration requestDelay() {
				return java.time.Duration.ofMillis(100);
			}

			@Override
			public String defaultPassword() {
				return "Import-%d-ChangeMe!";
			}

			@Override
			public Optional<Integer> authenticatedRoleId() {
				return Optional.empty();
			}
		});
	}

	private Member breederMember(Optional<Boolean> publishMyData) {
		return new Member(
			10927,
			Optional.of(false),
			Optional.empty(),
			Optional.of("Lena"),
			Optional.of("Babel"),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.of("lena@example.de"),
			Optional.empty(),
			Optional.of(true),
			Optional.of(152544),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			publishMyData,
			"doc-1",
			9
		);
	}

	@Test
	void mapsDogFieldsToStrapiSchema() {
		Dog dog = new Dog(
			23824,
			Optional.of("Do It Again"),
			Optional.of("Enormous Do It Again"),
			Optional.of(7402),
			Optional.of(10745),
			Optional.of("616093901903935"),
			Optional.of(DogSex.F),
			Optional.of(LocalDate.of(2022, 5, 24)),
			Optional.empty(),
			Optional.of(true),
			Optional.of(DogHd.B1),
			Optional.of(DogSod1.N_N),
			Optional.of(true),
			Optional.of(true),
			Optional.of(true),
			Optional.of(DogColor.B),
			Optional.of("PKR.II-156446"),
			Optional.of("CMKU/HW/7794/14"),
			Optional.of("PKR. II-129361"),
			Optional.of("Show notes"),
			Optional.of("Verhalten III"),
			Optional.of("Enormous")
		);

		Map<String, Object> payload = StrapiPayloadMapper.toDogInput(dog);

		assertEquals(23824, payload.get("cId"));
		assertEquals("Do It Again", payload.get("givenName"));
		assertEquals("B1", payload.get("HD"));
		assertEquals("N_N", payload.get("SOD1"));
		assertEquals(true, payload.get("cFertile"));
		assertEquals(true, payload.get("Genprofil"));
		assertEquals(7402, payload.get("cBreederId"));
		assertEquals(10745, payload.get("cOwnerId"));
		assertEquals("PKR.II-156446", payload.get("cStudBookNumber"));
		assertTrue(!payload.containsKey("owner"));
		assertTrue(!payload.containsKey("breeder"));
	}

	@Test
	void usesFallbackEmailWhenCsvHasNoEmail() {
		Mockito.when(config.strapi()).thenReturn(new ImporterConfig.StrapiConfig() {
			@Override
			public String baseUrl() {
				return "http://localhost:1337/api";
			}

			@Override
			public Optional<String> apiToken() {
				return Optional.empty();
			}

			@Override
			public java.time.Duration httpTimeout() {
				return java.time.Duration.ofSeconds(30);
			}

			@Override
			public int pageSize() {
				return 100;
			}

			@Override
			public int maxRetries() {
				return 3;
			}

			@Override
			public java.time.Duration requestDelay() {
				return java.time.Duration.ofMillis(100);
			}

			@Override
			public String defaultPassword() {
				return "Import-%d-ChangeMe!";
			}

			@Override
			public Optional<Integer> authenticatedRoleId() {
				return Optional.empty();
			}
		});

		Member member = new Member(
			42,
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
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);

		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(member, config, true, 2);
		assertEquals("hzd.42@hovawarte.com", payload.get("email"));
		assertTrue(payload.containsKey("password"));
	}
}
