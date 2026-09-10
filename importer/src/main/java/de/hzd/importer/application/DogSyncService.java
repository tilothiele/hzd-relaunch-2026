package de.hzd.importer.application;

import de.hzd.importer.adapter.strapi.StrapiDogAdapter;
import de.hzd.importer.adapter.strapi.StrapiMemberAdapter;
import de.hzd.importer.adapter.strapi.StrapiRestClient;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.Member;
import de.hzd.importer.port.DogSyncPort;
import de.hzd.util.Ticker;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DogSyncService implements DogSyncPort {

	private static final Logger LOG = Logger.getLogger(DogSyncService.class);

	@Inject
	StrapiDogAdapter strapiDogAdapter;

	@Inject
	StrapiRestClient strapiRestClient;

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	@Inject
	ImportHooks importHooks;

	public record DogSyncStatistics(int breedersCreated) {
		public static DogSyncStatistics empty() {
			return new DogSyncStatistics(0);
		}
	}

	@Override
	public DogSyncPort.BreederPreparationResult prepareBreeders(List<Dog> dogs) {
		strapiDogAdapter.clearBreederCache();

		int breedersCreated = 0;
		return new DogSyncPort.BreederPreparationResult(breedersCreated);
	}

	@Override
	public SyncResult sync(Dog dog) {
		if (!importHooks.needUpsertDog(dog)) {
			return SyncResult.SKIPPED;
		}

		int breederDocumentId = dog.breederId().get().intValue();

		StrapiDogAdapter.UpsertResult result = strapiDogAdapter.upsert(dog, breederDocumentId);
		strapiRestClient.delayBetweenRequests();
		return result == StrapiDogAdapter.UpsertResult.CREATED
			? SyncResult.CREATED
			: SyncResult.UPDATED;
	}
}
