package de.hzd.importer.application;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ImportHooksTest {

	private final ImportHooks hooks = new ImportHooks();

	@Test
	void needUpsertHooksDefaultToTrue() {
		assertTrue(hooks.needUpsertUser(null));
		assertTrue(hooks.needUpsertDog(null));
		assertTrue(hooks.needUpsertBreeder(null));
	}
}
