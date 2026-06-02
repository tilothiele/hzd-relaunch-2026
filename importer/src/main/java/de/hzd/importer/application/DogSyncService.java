package de.hzd.importer.application;

import de.hzd.importer.adapter.strapi.StrapiDogAdapter;
import de.hzd.importer.adapter.strapi.StrapiRestClient;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.port.DogSyncPort;
import de.hzd.util.Ticker;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DogSyncService implements DogSyncPort {

	private static final Logger LOG = Logger.getLogger(DogSyncService.class);

	@Inject
	StrapiDogAdapter strapiDogAdapter;

	@Inject
	StrapiRestClient strapiRestClient;

	private final Map<Integer, Optional<String>> breederCache = new HashMap<>();

	public record DogSyncStatistics(int breedersCreated) {
		public static DogSyncStatistics empty() {
			return new DogSyncStatistics(0);
		}
	}

	@Override
	public DogSyncPort.BreederPreparationResult prepareBreeders(List<Dog> dogs) {
		strapiDogAdapter.clearCache();
		Map<Integer, Optional<String>> breederData = new HashMap<>();
		for (Dog dog : dogs) {
			dog.breederId().ifPresent(breederId ->
				breederData.putIfAbsent(breederId, dog.breederKennelName())
			);
		}

		int breedersCreated = 0;
		breederCache.clear();
		Ticker logTicker = new Ticker(10000l);
		long t0 = System.currentTimeMillis();
		int i=0;
		for (Map.Entry<Integer, Optional<String>> entry : breederData.entrySet()) {
			final int j = i++;
			logTicker.tick(() -> Log.info(Ticker.formatProceedingMessage(t0, breederData.entrySet().size(), j, "Breeder")));
			try {
				boolean created = strapiDogAdapter.ensureBreeder(entry.getKey(), entry.getValue(), Optional.empty());
				if (created) {
					breedersCreated++;
				}
				breederCache.put(
					entry.getKey(),
					strapiDogAdapter.findBreederDocumentId(entry.getKey())
				);
				strapiRestClient.delayBetweenRequests();
			} catch (RuntimeException exception) {
				LOG.errorf(exception, "Failed to ensure breeder cId=%d", entry.getKey());
				breederCache.put(entry.getKey(), Optional.empty());
			}
		}
		return new DogSyncPort.BreederPreparationResult(breedersCreated);
	}

	@Override
	public SyncResult sync(Dog dog) {
		Optional<String> breederDocumentId = dog.breederId()
			.flatMap(breederId -> breederCache.containsKey(breederId)
				? breederCache.get(breederId)
				: strapiDogAdapter.findBreederDocumentId(breederId));

		StrapiDogAdapter.UpsertResult result = strapiDogAdapter.upsert(dog, breederDocumentId);
		strapiRestClient.delayBetweenRequests();
		return result == StrapiDogAdapter.UpsertResult.CREATED
			? SyncResult.CREATED
			: SyncResult.UPDATED;
	}
}
