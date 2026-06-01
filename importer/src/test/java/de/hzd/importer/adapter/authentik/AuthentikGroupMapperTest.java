package de.hzd.importer.adapter.authentik;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AuthentikGroupMapperTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void mapsGroupNamesToUuidFromApiResults() throws Exception {
		JsonNode results = objectMapper.readTree("""
			[
				{
					"pk": "6b2f8f1a-4d3c-4b5e-9f0a-1c2d3e4f5a6b",
					"num_pk": 14788,
					"name": "hzd-member"
				},
				{
					"pk": "11111111-1111-1111-1111-111111111111",
					"name": "other-group"
				}
			]
			""");

		AuthentikGroupMapper mapper = AuthentikGroupMapper.fromApiResults(results);

		assertEquals(2, mapper.size());
		assertEquals(
			"6b2f8f1a-4d3c-4b5e-9f0a-1c2d3e4f5a6b",
			mapper.uuidForName("hzd-member").orElseThrow()
		);
		assertEquals(
			List.of("6b2f8f1a-4d3c-4b5e-9f0a-1c2d3e4f5a6b"),
			mapper.uuidsForNames(new String[] { "hzd-member" })
		);
	}

	@Test
	void ignoresGroupsWithoutUuidPk() throws Exception {
		JsonNode results = objectMapper.readTree("""
			[
				{
					"pk": 7,
					"num_pk": 14788,
					"name": "legacy-group"
				}
			]
			""");

		AuthentikGroupMapper mapper = AuthentikGroupMapper.fromApiResults(results);

		assertEquals(0, mapper.size());
		assertTrue(mapper.uuidForName("legacy-group").isEmpty());
	}

	@Test
	void warnsOnUnknownGroupName() {
		AuthentikGroupMapper mapper = AuthentikGroupMapper.fromEntries(
			Map.of("hzd-member", "6b2f8f1a-4d3c-4b5e-9f0a-1c2d3e4f5a6b")
		);

		assertTrue(mapper.uuidsForNames(new String[] { "missing-group" }).isEmpty());
		assertFalse(mapper.uuidForName("missing-group").isPresent());
	}
}
