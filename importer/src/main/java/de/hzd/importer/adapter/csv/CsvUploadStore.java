package de.hzd.importer.adapter.csv;

import de.hzd.importer.infrastructure.config.ImporterConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@ApplicationScoped
public class CsvUploadStore {

	static final String DEFAULT_DIRECTORY_NAME = "hzd-importer";

	@Inject
	ImporterConfig config;

	public UploadedCsvFiles store(Path membersSource, Path dogsSource) {
		try {
			Path root = uploadRoot();
			Files.createDirectories(root);
			Path directory = Files.createTempDirectory(root, "import-");
			Path membersPath = directory.resolve("members.csv");
			Path dogsPath = directory.resolve("dogs.csv");
			Files.copy(membersSource, membersPath, StandardCopyOption.REPLACE_EXISTING);
			Files.copy(dogsSource, dogsPath, StandardCopyOption.REPLACE_EXISTING);
			return new UploadedCsvFiles(directory, membersPath, dogsPath);
		} catch (IOException exception) {
			throw new IllegalStateException("Failed to store uploaded CSV files", exception);
		}
	}

	public Path uploadRoot() {
		return config.csv()
			.uploadDirectory()
			.filter(value -> !value.isBlank())
			.map(Path::of)
			.orElseGet(() -> Path.of(System.getProperty("java.io.tmpdir"), DEFAULT_DIRECTORY_NAME))
			.toAbsolutePath()
			.normalize();
	}
}
