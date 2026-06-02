package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import de.hzd.importer.domain.Dog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiDogAdapter {

	private static final Logger LOG = Logger.getLogger(StrapiDogAdapter.class);

	@Inject
	StrapiRestClient client;

	private final Map<Integer, String> documentIdsByCId = new HashMap<>();

	public enum UpsertResult {
		CREATED,
		UPDATED
	}

	public void clearCache() {
		documentIdsByCId.clear();
	}

	public boolean ensureBreeder(int breederCId, Optional<String> kennelName, Optional<Boolean> isActiveBreeder) {
		Optional<String> existingBreederId = client.findDocumentIdByCId(
			StrapiResources.BREEDERS,
			breederCId
		);
		Map<String, Object> payload = StrapiPayloadMapper.toBreederInput(
			breederCId,
			kennelName,
			existingBreederId.isEmpty(),
			isActiveBreeder,
			Optional.empty()
		);

		if (existingBreederId.isPresent()) {
			client.update(
				StrapiResources.BREEDERS,
				existingBreederId.get(),
				payload,
				true
			);
			return false;
		}

		client.create(StrapiResources.BREEDERS, payload, true);
		LOG.infof("Created breeder cId=%d from dog import", breederCId);
		return true;
	}

	public Optional<String> findBreederDocumentId(int breederCId) {
		return client.findDocumentIdByCId(StrapiResources.BREEDERS, breederCId);
	}

	public Optional<String> findOwnerDocumentId(int ownerCId) {
		return client.findDocumentIdByCId(StrapiResources.USERS, ownerCId);
	}

	public UpsertResult upsert(Dog dog, Optional<String> breederDocumentId) {
		Map<String, Object> payload = StrapiPayloadMapper.toDogInput(dog);

		boolean ownerResolvable = dog.ownerId().flatMap(this::findOwnerDocumentId).isPresent();
		boolean breederResolvable = dog.breederId()
			.flatMap(breederId -> breederDocumentId.isPresent()
				? breederDocumentId
				: findBreederDocumentId(breederId))
			.isPresent();

		Optional<String> existingId = findDogDocumentId(dog.cId());
		if (existingId.isPresent()) {
			updateDog(dog.cId(), existingId.get(), payload, ownerResolvable, breederResolvable);
			return UpsertResult.UPDATED;
		}

		try {
			JsonNode response = client.create(StrapiResources.DOGS, payload, true);
			String documentId = client.readDocumentId(response)
				.orElseThrow(() -> new StrapiClientException("Strapi dog create returned no documentId"));
			documentIdsByCId.put(dog.cId(), documentId);
			LOG.infof(
				"Created dog cId=%d documentId=%s ownerLinked=%s breederLinked=%s",
				dog.cId(),
				documentId,
				ownerResolvable,
				breederResolvable
			);
			return UpsertResult.CREATED;
		} catch (StrapiClientException exception) {
			if (!isDuplicateCIdError(exception)) {
				throw exception;
			}

			Optional<String> resolvedId = findDogDocumentId(dog.cId());
			if (resolvedId.isEmpty()) {
				throw exception;
			}

			LOG.warnf(
				exception,
				"Dog cId=%d already exists, retrying as update",
				dog.cId()
			);
			updateDog(dog.cId(), resolvedId.get(), payload, ownerResolvable, breederResolvable);
			return UpsertResult.UPDATED;
		}
	}

	private Optional<String> findDogDocumentId(int cId) {
		String cachedDocumentId = documentIdsByCId.get(cId);
		if (cachedDocumentId != null && !cachedDocumentId.isBlank()) {
			return Optional.of(cachedDocumentId);
		}

		Optional<String> found = client.findDocumentIdByCId(StrapiResources.DOGS, cId);
		found.ifPresent(documentId -> documentIdsByCId.put(cId, documentId));
		return found;
	}

	private void updateDog(
		int cId,
		String documentId,
		Map<String, Object> payload,
		boolean ownerResolvable,
		boolean breederResolvable
	) {
		client.update(StrapiResources.DOGS, documentId, payload, true);
		documentIdsByCId.put(cId, documentId);
		LOG.infof(
			"Updated dog cId=%d documentId=%s ownerLinked=%s breederLinked=%s",
			cId,
			documentId,
			ownerResolvable,
			breederResolvable
		);
	}

	private boolean isDuplicateCIdError(StrapiClientException exception) {
		String message = exception.getMessage();
		return message != null
			&& message.contains("must be unique")
			&& message.contains("cId");
	}
}
