package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class StrapiResponseReaderTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void readsItemsFromResultsWrapper() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"results": [
					{ "documentId": "doc-2", "cId": 6621 }
				],
				"pagination": {
					"page": 1,
					"pageSize": 25,
					"pageCount": 1,
					"total": 1
				}
			}
			""");

		JsonNode items = StrapiResponseReader.readResultItems(response);

		assertEquals(1, items.size());
		assertEquals("doc-2", StrapiResponseReader.readResourceId(items.get(0)).orElseThrow());
	}

	@Test
	void readsItemsFromDataWrapper() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"data": [
					{ "documentId": "doc-1", "email": "a@example.de" }
				]
			}
			""");

		JsonNode items = StrapiResponseReader.readResultItems(response);

		assertEquals(1, items.size());
		assertEquals("doc-1", StrapiResponseReader.readResourceId(items.get(0)).orElseThrow());
	}

	@Test
	void readsItemsFromRootArray() throws Exception {
		JsonNode response = objectMapper.readTree("""
			[
				{ "id": 9, "email": "a@example.de" }
			]
			""");

		JsonNode items = StrapiResponseReader.readResultItems(response);

		assertEquals(1, items.size());
		assertEquals("9", StrapiResponseReader.readResourceId(items.get(0)).orElseThrow());
	}

	@Test
	void prefersDocumentIdOverNumericId() throws Exception {
		JsonNode item = objectMapper.readTree("""
			{ "documentId": "doc-1", "id": 9 }
			""");

		assertEquals("doc-1", StrapiResponseReader.readResourceId(item).orElseThrow());
	}

	@Test
	void returnsEmptyWhenNoIdentifierExists() throws Exception {
		JsonNode item = objectMapper.readTree("""
			{ "email": "a@example.de" }
			""");

		assertTrue(StrapiResponseReader.readResourceId(item).isEmpty());
	}

	@Test
	void stopsAfterRootArrayResponse() throws Exception {
		JsonNode response = objectMapper.readTree("""
			[
				{ "id": 1, "email": "a@example.de" },
				{ "id": 2, "email": "b@example.de" }
			]
			""");

		assertFalse(StrapiResponseReader.hasNextPage(response, 1, 2, 100));
	}

	@Test
	void readsNumericIdFromNumberField() throws Exception {
		JsonNode item = objectMapper.readTree("""
			{ "documentId": "doc-1", "id": 9 }
			""");

		assertEquals(9, StrapiResponseReader.readNumericId(item).orElseThrow());
		assertEquals(
			"doc-1",
			StrapiUserRef.fromJson(item).orElseThrow().documentId()
		);
		assertEquals(
			9,
			StrapiUserRef.fromJson(item).orElseThrow().numericId()
		);
	}

	@Test
	void readsBooleanFieldFromJson() throws Exception {
		com.fasterxml.jackson.databind.ObjectMapper objectMapper =
			new com.fasterxml.jackson.databind.ObjectMapper();
		com.fasterxml.jackson.databind.JsonNode item = objectMapper.readTree("""
			{ "publishMyData": true, "cFlagAccess": false }
			""");

		assertEquals(
			Optional.of(true),
			StrapiResponseReader.readBooleanField(item, "publishMyData")
		);
		assertEquals(
			Optional.of(false),
			StrapiResponseReader.readBooleanField(item, "cFlagAccess")
		);
	}

	@Test
	void usesPaginationMetaWhenPresent() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"data": [{ "documentId": "doc-1" }],
				"meta": {
					"pagination": {
						"page": 1,
						"pageSize": 100,
						"pageCount": 3,
						"total": 250
					}
				}
			}
			""");

		assertTrue(StrapiResponseReader.hasNextPage(response, 1, 100, 100));
		assertFalse(StrapiResponseReader.hasNextPage(response, 3, 50, 100));
	}

	@Test
	void stopsWhenResponseHasNoPaginationMeta() throws Exception {
		JsonNode response = objectMapper.readTree("""
			{
				"data": [{ "documentId": "doc-1" }]
			}
			""");

		assertFalse(StrapiResponseReader.hasNextPage(response, 1, 8380, 100));
	}
}
