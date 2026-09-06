package de.hzd.importer.adapter.csv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import de.hzd.importer.infrastructure.config.ImporterConfig;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CsvUploadStoreTest {

	@TempDir
	Path tempDir;

	@Test
	void copiesUploadsIntoConfiguredDirectory() throws Exception {
		CsvUploadStore store = store(tempDir.toString());
		Path members = Files.writeString(tempDir.resolve("src-members.csv"), "members");
		Path dogs = Files.writeString(tempDir.resolve("src-dogs.csv"), "dogs");

		UploadedCsvFiles uploaded = store.store(members, dogs);

		assertTrue(uploaded.directory().startsWith(tempDir.toAbsolutePath().normalize()));
		assertEquals("members.csv", uploaded.membersPath().getFileName().toString());
		assertEquals("dogs.csv", uploaded.dogsPath().getFileName().toString());
		assertEquals("members", Files.readString(uploaded.membersPath()));
		assertEquals("dogs", Files.readString(uploaded.dogsPath()));

		uploaded.delete();
		assertFalse(Files.exists(uploaded.membersPath()));
		assertFalse(Files.exists(uploaded.dogsPath()));
		assertFalse(Files.exists(uploaded.directory()));
	}

	@Test
	void usesSystemTempWhenDirectoryIsBlank() {
		CsvUploadStore store = store("  ");
		Path root = store.uploadRoot();
		assertEquals(
			Path.of(System.getProperty("java.io.tmpdir"), "hzd-importer").toAbsolutePath().normalize(),
			root
		);
	}

	private static CsvUploadStore store(String directory) {
		ImporterConfig config = mock(ImporterConfig.class);
		ImporterConfig.CsvConfig csvConfig = mock(ImporterConfig.CsvConfig.class);
		when(config.csv()).thenReturn(csvConfig);
		when(csvConfig.uploadDirectory()).thenReturn(Optional.ofNullable(directory));

		CsvUploadStore store = new CsvUploadStore();
		try {
			var field = CsvUploadStore.class.getDeclaredField("config");
			field.setAccessible(true);
			field.set(store, config);
		} catch (ReflectiveOperationException exception) {
			throw new IllegalStateException(exception);
		}
		return store;
	}
}
