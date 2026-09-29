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

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	private final Map<Integer, String> documentIdsByCId = new HashMap<>();
	private final Map<Integer, JsonNode> dogNodesByCId = new HashMap<>();

	public enum UpsertResult {
		CREATED,
		UPDATED
	}

	public void clearCache() {
		documentIdsByCId.clear();
		dogNodesByCId.clear();
	}

	public boolean ensureStudBreeder(int breederCId, Optional<String> ownerMemberDocumentId) {
		Optional<JsonNode> existingBreeder = client.findFirstByCId(
			StrapiResources.BREEDERS,
			breederCId
		);
		if (existingBreeder.flatMap(StrapiResponseReader::readResourceId).isPresent()) {
			return false;
		}

		strapiMemberAdapter.ensureOwnerMembersPublishMyDataBeforeBreederSave(
			breederCId,
			ownerMemberDocumentId.isPresent() ? Optional.of(breederCId) : Optional.empty()
		);

		Optional<String> kennelName = strapiMemberAdapter.resolveOwnerKennelName(breederCId);
		Map<String, Object> payload = StrapiPayloadMapper.toStudBreederInput(
			breederCId,
			ownerMemberDocumentId,
			kennelName,
			strapiMemberAdapter.resolveOwnerAddress(breederCId)
		);
		client.create(StrapiResources.BREEDERS, payload, true);
		LOG.infof("Created stud breeder cId=%d from dog import", breederCId);
		return true;
	}

	public boolean ensureBreeder(int breederCId, Optional<String> kennelName, Optional<Boolean> isActiveBreeder) {
		Optional<JsonNode> existingBreeder = client.findFirstByCId(
			StrapiResources.BREEDERS,
			breederCId
		);
		Optional<String> existingBreederId = existingBreeder.flatMap(StrapiResponseReader::readResourceId);

		// Strapi beforeUpdate verknüpft per cId automatisch owner_members (linkBreederMemberFromCId).
		strapiMemberAdapter.ensureOwnerMembersPublishMyDataBeforeBreederSave(
			breederCId,
			Optional.of(breederCId)
		);

		if (existingBreederId.isPresent()) {
			client.update(
				StrapiResources.BREEDERS,
				existingBreederId.get(),
				StrapiPayloadMapper.toBreederUpdateInput(
					breederCId,
					kennelName,
					isActiveBreeder,
					Optional.empty()
				),
				true
			);
			return false;
		}

		client.create(
			StrapiResources.BREEDERS,
			StrapiPayloadMapper.toBreederInsertInput(
				breederCId,
				kennelName,
				isActiveBreeder,
				Optional.empty()
			),
			true
		);
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
		boolean ownerResolvable = dog.ownerId().flatMap(this::findOwnerDocumentId).isPresent();
		boolean breederResolvable = dog.breederId()
			.flatMap(breederId -> breederDocumentId.isPresent()
				? breederDocumentId
				: findBreederDocumentId(breederId))
			.isPresent();

		Optional<JsonNode> existing = findDogNode(dog.cId());
		Optional<String> existingId = existing.flatMap(StrapiResponseReader::readResourceId);
		if (existingId.isPresent()) {
			updateDog(
				dog.cId(),
				existingId.get(),
				StrapiPayloadMapper.toDogUpdateInput(dog),
				ownerResolvable,
				breederResolvable
			);
			return UpsertResult.UPDATED;
		}

		try {
			JsonNode response = client.create(
				StrapiResources.DOGS,
				StrapiPayloadMapper.toDogInsertInput(dog),
				true
			);
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

			Optional<JsonNode> resolved = findDogNode(dog.cId());
			Optional<String> resolvedId = resolved.flatMap(StrapiResponseReader::readResourceId);
			if (resolvedId.isEmpty()) {
				throw exception;
			}

			LOG.warnf(
				exception,
				"Dog cId=%d already exists, retrying as update",
				dog.cId()
			);
			updateDog(
				dog.cId(),
				resolvedId.get(),
				StrapiPayloadMapper.toDogUpdateInput(dog),
				ownerResolvable,
				breederResolvable
			);
			return UpsertResult.UPDATED;
		}
	}

	private Optional<JsonNode> findDogNode(int cId) {
		if (dogNodesByCId.containsKey(cId)) {
			return Optional.ofNullable(dogNodesByCId.get(cId));
		}

		Optional<JsonNode> found = client.findFirstByCId(StrapiResources.DOGS, cId);
		if (found.isEmpty()) {
			return Optional.empty();
		}
		JsonNode node = found.get();
		dogNodesByCId.put(cId, node);
		StrapiResponseReader.readResourceId(node).ifPresent(documentId -> documentIdsByCId.put(cId, documentId));
		return Optional.of(node);
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
//		LOG.infof(
//			"Updated dog cId=%d documentId=%s ownerLinked=%s breederLinked=%s",
//			cId,
//			documentId,
//			ownerResolvable,
//			breederResolvable
//		);
	}

	private boolean isDuplicateCIdError(StrapiClientException exception) {
		String message = exception.getMessage();
		return message != null
			&& message.contains("must be unique")
			&& message.contains("cId");
	}
}
