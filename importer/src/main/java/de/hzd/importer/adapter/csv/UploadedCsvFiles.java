package de.hzd.importer.adapter.csv;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public record UploadedCsvFiles(
		Path directory,
		Path membersPath,
		Path dogsPath
) {
	public void delete() {
		deleteQuietly(membersPath);
		deleteQuietly(dogsPath);
		deleteQuietly(directory);
	}

	private static void deleteQuietly(Path path) {
		if (path == null) {
			return;
		}
		try {
			Files.deleteIfExists(path);
		} catch (IOException ignored) {
			// best-effort cleanup of temporary upload files
		}
	}
}
