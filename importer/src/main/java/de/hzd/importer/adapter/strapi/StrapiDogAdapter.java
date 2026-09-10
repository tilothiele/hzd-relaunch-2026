package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiDogAdapter {

	private static final Logger LOG = Logger.getLogger(StrapiDogAdapter.class);

	@Inject
	StrapiRestClient client;

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	@Inject
	ImporterConfig config;

	private final Map<Integer, StrapiDogSnapshot> dogsByCId = new HashMap<>();
	private final Map<Integer, Optional<String>> breederDocumentIdsByCId = new HashMap<>();

	public enum UpsertResult {
		CREATED,
		UPDATED
	}

	public record StrapiDogSnapshot(
		String documentId,
		int id,
		int cId,
		Optional<String> givenName,
		Optional<String> fullKennelName,
		Optional<Integer> cBreederId,
		Optional<Integer> cOwnerId,
		Optional<String> microchipNo,
		Optional<DogSex> sex,
		Optional<LocalDate> dateOfBirth,
		Optional<LocalDate> dateOfDeath,
		Optional<Boolean> cFertile,
		Optional<DogHd> hd,
		Optional<DogSod1> sod1,
		Optional<Boolean> heartCheck,
		Optional<Boolean> eyesCheck,
		Optional<Boolean> genprofil,
		Optional<DogColor> color,
		Optional<String> studbookNumber,
		Optional<String> studbookNumberFather,
		Optional<String> studbookNumberMother,
		Optional<String> exhibitions,
		Optional<String> breedSurvey
	) {
		static Optional<StrapiDogSnapshot> fromJson(JsonNode node) {
			JsonNode item = unwrap(node);
			if (item == null || item.isNull() || item.isMissingNode()) {
				return Optional.empty();
			}

			Optional<String> documentId = StrapiResponseReader.readResourceId(item);
			if (documentId.isEmpty()) {
				return Optional.empty();
			}
		

			int cId = StrapiResponseReader.readIntegerField(item, "cId").orElse(-1);
			return Optional.of(new StrapiDogSnapshot(
				documentId.get(),
				StrapiResponseReader.readNumericId(item).orElse(0),
				cId,
				StrapiResponseReader.readTextField(item, "givenName"),
				StrapiResponseReader.readTextField(item, "fullKennelName"),
				StrapiResponseReader.readIntegerField(item, "cBreederId"),
				StrapiResponseReader.readIntegerField(item, "cOwnerId"),
				StrapiResponseReader.readTextField(item, "microchipNo"),
				readEnum(item, "sex", DogSex.class),
				readDate(item, "dateOfBirth"),
				readDate(item, "dateOfDeath"),
				StrapiResponseReader.readBooleanField(item, "cFertile"),
				readEnum(item, "HD", DogHd.class),
				readEnum(item, "SOD1", DogSod1.class),
				StrapiResponseReader.readBooleanField(item, "HeartCheck"),
				StrapiResponseReader.readBooleanField(item, "EyesCheck"),
				StrapiResponseReader.readBooleanField(item, "Genprofil"),
				readEnum(item, "color", DogColor.class),
				StrapiResponseReader.readTextField(item, "cStudBookNumber"),
				StrapiResponseReader.readTextField(item, "cStudBookNumberFather"),
				StrapiResponseReader.readTextField(item, "cStudBookNumberMother"),
				StrapiResponseReader.readTextField(item, "Exhibitions"),
				StrapiResponseReader.readTextField(item, "BreedSurvey")
			));
		}

		static StrapiDogSnapshot fromDomain(Dog dog, String documentId, int id) {
			return new StrapiDogSnapshot(
				documentId,
				id,
				dog.cId(),
				dog.givenName(),
				dog.fullKennelName(),
				dog.breederId(),
				dog.ownerId(),
				dog.chipNumber(),
				dog.sex(),
				dog.dateOfBirth(),
				dog.dateOfDeath(),
				dog.cFertile(),
				dog.hd(),
				dog.sod1(),
				dog.heartCheck(),
				dog.eyesCheck(),
				dog.genprofil(),
				dog.color(),
				dog.studbookNumber(),
				dog.studbookNumberFather(),
				dog.studbookNumberMother(),
				dog.exhibitions(),
				dog.breedSurvey()
			);
		}

		private static JsonNode unwrap(JsonNode node) {
			if (node != null && node.has("data") && node.get("data").isObject()) {
				return node.get("data");
			}
			return node;
		}

		private static Optional<LocalDate> readDate(JsonNode item, String field) {
			Optional<String> text = StrapiResponseReader.readTextField(item, field);
			if (text.isEmpty()) {
				return Optional.empty();
			}
			try {
				return Optional.of(LocalDate.parse(text.get()));
			} catch (DateTimeParseException exception) {
				return Optional.empty();
			}
		}

		private static <E extends Enum<E>> Optional<E> readEnum(
			JsonNode item,
			String field,
			Class<E> type
		) {
			Optional<String> text = StrapiResponseReader.readTextField(item, field);
			if (text.isEmpty()) {
				return Optional.empty();
			}
			try {
				return Optional.of(Enum.valueOf(type, text.get()));
			} catch (IllegalArgumentException exception) {
				return Optional.empty();
			}
		}
	}

	public StrapiDogSnapshot getCachedDogByCid(int cId) {
		return dogsByCId.get(cId);
	}

	public Optional<String> getCachedBreederDocumentIdByCid(int cId) {
		return breederDocumentIdsByCId.get(cId);
	}

	public void cacheBreederDocumentId(int cId, Optional<String> documentId) {
		breederDocumentIdsByCId.put(
			cId,
			documentId == null ? Optional.empty() : documentId
		);
	}

	public void setImportCache(Collection<StrapiDogSnapshot> dogs) {
		dogsByCId.clear();
		if (dogs == null) {
			return;
		}
		for (StrapiDogSnapshot dog : dogs) {
			if (dog != null && dog.cId() > 0) {
				dogsByCId.putIfAbsent(dog.cId(), dog);
			}
		}
	}

	public void clearBreederCache() {
		breederDocumentIdsByCId.clear();
	}

	public void clearCache() {
		dogsByCId.clear();
		breederDocumentIdsByCId.clear();
	}

	public Collection<StrapiDogSnapshot> fetchAllDogs() {
		int pageSize = config.strapi().pageSize();
		List<StrapiDogSnapshot> dogs = new ArrayList<>();
		int page = 1;
		Set<Integer> cIds = new HashSet<>();

		while (true) {
			Log.info("fetching dog from strapi - page #" + page);
			JsonNode response = client.listAllPaginated(
				StrapiResources.DOGS,
				page,
				pageSize,
				Map.of("sort[0]", "cId:asc")
			);
			JsonNode items = StrapiResponseReader.readResultItems(response);
			if (items == null || items.isEmpty()) {
				break;
			}

			for (JsonNode item : items) {
				Optional<StrapiDogSnapshot> snapshot = StrapiDogSnapshot.fromJson(item);
				if (snapshot.isEmpty()) {
					continue;
				}
				StrapiDogSnapshot dog = snapshot.get();
				if (dog.cId() > 0) {
					dogs.add(dog);
					cIds.add(dog.cId());
				}
			}

			if (!StrapiResponseReader.hasNextPage(response, page, items.size(), pageSize)) {
				break;
			}
			page++;
			client.delayBetweenRequests();
		}

		for (int cId : cIds) {
			long n = dogs.stream().filter(dog -> dog.cId() == cId).count();
			if (n > 1) {
				LOG.errorf("für dog cId=%d wurden %d einträge gefunden.", cId, n);
			}
		}

		LOG.infof("Fetched %d dogs from Strapi", dogs.size());
		return dogs;
	}

	public boolean ensureStudBreeder(int breederCId, Optional<String> ownerMemberDocumentId) {

		Map<String, Object> payload = StrapiPayloadMapper.toStudBreederInput(
			breederCId,
			ownerMemberDocumentId,
			strapiMemberAdapter.resolveOwnerKennelName(breederCId),
			strapiMemberAdapter.resolveOwnerAddress(breederCId)
		);
		client.create(StrapiResources.BREEDERS, payload, true);
		LOG.infof("Created stud breeder cId=%d from dog import", breederCId);
		return true;
	}

	public boolean ensureBreeder(int breederCId, Optional<String> kennelName, Optional<Boolean> isActiveBreeder) {

		return true;
	}


	public UpsertResult upsert(Dog dog, int breederId) {
		Map<String, Object> payload = StrapiPayloadMapper.toDogInput(dog);


		Optional<StrapiDogSnapshot> existing = findDog(dog.cId());
		if (existing.isPresent()) {
			updateDog(dog, existing.get().documentId(), payload);
			return UpsertResult.UPDATED;
		}

		try {
			JsonNode response = client.create(StrapiResources.DOGS, payload, true);
			String documentId = client.readDocumentId(response)
				.orElseThrow(() -> new StrapiClientException("Strapi dog create returned no documentId"));
			putDogInCache(dog, documentId, response);
			LOG.infof(
				"Created dog cId=%d documentId=%s",
				dog.cId(),
				documentId
			);
			return UpsertResult.CREATED;
		} catch (StrapiClientException exception) {
			if (!isDuplicateCIdError(exception)) {
				throw exception;
			}

			Optional<StrapiDogSnapshot> resolved = findDog(dog.cId());
			if (resolved.isEmpty()) {
				throw exception;
			}

			LOG.warnf(
				exception,
				"Dog cId=%d already exists, retrying as update",
				dog.cId()
			);
			updateDog(dog, resolved.get().documentId(), payload);
			return UpsertResult.UPDATED;
		}
	}

	private Optional<StrapiDogSnapshot> findDog(int cId) {
		StrapiDogSnapshot cached = dogsByCId.get(cId);
		if (cached != null) {
			return Optional.of(cached);
		}

		JsonNode response = client.list(
			StrapiResources.DOGS,
			Map.of("filters[cId][$eq]", Integer.toString(cId))
		);
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return Optional.empty();
		}

		Optional<StrapiDogSnapshot> snapshot = StrapiDogSnapshot.fromJson(items.get(0));
		snapshot.ifPresent(dog -> dogsByCId.put(cId, dog));
		return snapshot;
	}

	private void updateDog(
		Dog dog,
		String documentId,
		Map<String, Object> payload
	) {
		JsonNode response = client.update(StrapiResources.DOGS, documentId, payload, true);
		putDogInCache(dog, documentId, response);
	}

	private void putDogInCache(Dog dog, String documentId, JsonNode response) {
		Optional<StrapiDogSnapshot> parsed = StrapiDogSnapshot.fromJson(response);
		if (parsed.isPresent() && parsed.get().cId() > 0) {
			dogsByCId.put(dog.cId(), parsed.get());
			return;
		}
		int id = parsed.map(StrapiDogSnapshot::id).orElse(0);
		dogsByCId.put(dog.cId(), StrapiDogSnapshot.fromDomain(dog, documentId, id));
	}

	private boolean isDuplicateCIdError(StrapiClientException exception) {
		String message = exception.getMessage();
		return message != null
			&& message.contains("must be unique")
			&& message.contains("cId");
	}
}
