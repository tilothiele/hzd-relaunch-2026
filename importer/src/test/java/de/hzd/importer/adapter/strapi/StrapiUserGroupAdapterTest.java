package de.hzd.importer.adapter.strapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import de.hzd.importer.domain.UserGroup;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class StrapiUserGroupAdapterTest {

	@Test
	void getUserGroupByIdReturnsCachedGroup() {
		StrapiUserGroupAdapter adapter = new StrapiUserGroupAdapter();
		UserGroup koermeister = new UserGroup(
			"ug-koermeister",
			2,
			Optional.of("Körmeister")
		);
		adapter.setImportCache(List.of(
			new UserGroup("ug-sonderleiter", 1, Optional.of("Sonderleiter")),
			koermeister
		));

		assertEquals(koermeister, adapter.getUserGroupById(2));
		assertNull(adapter.getUserGroupById(99));
	}

	@Test
	void clearImportCacheRemovesGroups() {
		StrapiUserGroupAdapter adapter = new StrapiUserGroupAdapter();
		adapter.setImportCache(List.of(
			new UserGroup("ug-1", 1, Optional.of("Sonderleiter"))
		));

		adapter.clearImportCache();

		assertNull(adapter.getUserGroupById(1));
	}
}
