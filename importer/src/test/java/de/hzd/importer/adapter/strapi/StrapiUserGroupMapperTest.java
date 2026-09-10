package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.hzd.importer.domain.UserGroup;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class StrapiUserGroupMapperTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void readsUserGroupsFromFlatRelationArray() throws Exception {
		JsonNode relation = objectMapper.readTree("""
			[
				{ "id": 2, "documentId": "ug-koermeister", "Name": "Körmeister" },
				{ "id": 3, "documentId": "ug-zuchtwart", "Name": "Zuchtwart" }
			]
			""");

		List<UserGroup> groups = StrapiUserGroupMapper.fromRelation(relation);

		assertEquals(2, groups.size());
		assertEquals("ug-koermeister", groups.get(0).documentId());
		assertEquals(2, groups.get(0).id());
		assertEquals(Optional.of("Körmeister"), groups.get(0).name());
		assertEquals("ug-zuchtwart", groups.get(1).documentId());
	}

	@Test
	void readsUserGroupsFromDataWrapper() throws Exception {
		JsonNode relation = objectMapper.readTree("""
			{
				"data": [
					{ "id": 1, "documentId": "ug-1", "attributes": { "Name": "Sonderleiter" } }
				]
			}
			""");

		List<UserGroup> groups = StrapiUserGroupMapper.fromRelation(relation);

		assertEquals(1, groups.size());
		assertEquals("ug-1", groups.get(0).documentId());
		assertEquals(Optional.of("Sonderleiter"), groups.get(0).name());
	}

	@Test
	void returnsEmptyWhenRelationIsMissing() {
		assertTrue(StrapiUserGroupMapper.fromRelation(null).isEmpty());
	}

	@Test
	void readsUserGroupsFromCollectionResponse() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"data": [
					{ "id": 1, "documentId": "ug-1", "Name": "Sonderleiter" }
				]
			}
			""");

		List<UserGroup> groups = StrapiUserGroupMapper.fromCollectionResponse(response);

		assertEquals(1, groups.size());
		assertEquals("ug-1", groups.get(0).documentId());
		assertEquals("Sonderleiter", groups.get(0).name().orElseThrow());
	}
}
