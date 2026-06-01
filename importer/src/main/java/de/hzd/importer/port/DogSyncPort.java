package de.hzd.importer.port;

import de.hzd.importer.domain.Dog;
import java.util.List;

public interface DogSyncPort {
	enum SyncResult {
		CREATED,
		UPDATED
	}

	record BreederPreparationResult(int breedersCreated) {
		public static BreederPreparationResult empty() {
			return new BreederPreparationResult(0);
		}
	}

	BreederPreparationResult prepareBreeders(List<Dog> dogs);

	SyncResult sync(Dog dog);
}
