package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import de.hzd.importer.domain.Dog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.Optional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiDogAdapter {

	private static final Logger LOG = Logger.getLogger(StrapiDogAdapter.class);

	@Inject
	StrapiRestClient client;

	public enum UpsertResult {
		CREATED,
		UPDATED
	}

	public boolean ensureBreeder(int breederCId, Optional<String> kennelName) {
		Optional<String> existingBreederId = client.findDocumentIdByCId(
			StrapiResources.BREEDERS,
			breederCId
		);
		Map<String, Object> payload = StrapiPayloadMapper.toBreederInput(
			breederCId,
			kennelName,
			existingBreederId.isEmpty()
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
		Optional<String> existingId = client.findDocumentIdByCId(
			StrapiResources.DOGS,
			dog.cId()
		);
		Map<String, Object> payload = StrapiPayloadMapper.toDogInput(dog);

		boolean ownerResolvable = dog.ownerId().flatMap(this::findOwnerDocumentId).isPresent();
		boolean breederResolvable = dog.breederId()
			.flatMap(breederId -> breederDocumentId.isPresent()
				? breederDocumentId
				: findBreederDocumentId(breederId))
			.isPresent();

		if (existingId.isPresent()) {
			client.update(StrapiResources.DOGS, existingId.get(), payload, true);
			LOG.infof(
				"Updated dog cId=%d documentId=%s ownerLinked=%s breederLinked=%s",
				dog.cId(),
				existingId.get(),
				ownerResolvable,
				breederResolvable
			);
			return UpsertResult.UPDATED;
		}

		JsonNode response = client.create(StrapiResources.DOGS, payload, true);
		String documentId = client.readDocumentId(response)
			.orElseThrow(() -> new StrapiClientException("Strapi dog create returned no documentId"));
		LOG.infof(
			"Created dog cId=%d documentId=%s ownerLinked=%s breederLinked=%s",
			dog.cId(),
			documentId,
			ownerResolvable,
			breederResolvable
		);
		return UpsertResult.CREATED;
	}
}
