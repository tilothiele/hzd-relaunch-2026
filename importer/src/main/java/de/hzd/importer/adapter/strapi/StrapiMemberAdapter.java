package de.hzd.importer.adapter.strapi;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;

import de.hzd.importer.domain.Member;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class StrapiMemberAdapter {

	private static final Logger LOG = Logger.getLogger(StrapiMemberAdapter.class);

	@Inject
	StrapiRestClient client;

	@Inject
	ImporterConfig config;

	private Map<Integer, StrapiMemberSnapshot> membersByCid = Map.of();
	private Map<String, StrapiMemberSnapshot> membersByUsername = Map.of();
	private Map<Integer, Member> csvMembersByCid = Map.of();
	private int authenticatedRoleId = -1;

	public StrapiMemberSnapshot cachedMemberByCid(int cId) {
		return membersByCid.get(cId);
	}
	public StrapiMemberSnapshot cachedMemberByUsername(String username) {
		return membersByUsername.get(username);
	}
	
	public int fetchAuthenticatedRoleId() {
		Optional<Integer> configuredRoleId = config.strapi().authenticatedRoleId();
		if (configuredRoleId.isPresent()) {
			int roleId = configuredRoleId.get();
			LOG.infof("Using configured Strapi authenticated role id=%d", roleId);
			return roleId;
		}

		JsonNode response = client.list(StrapiResources.ROLES, Map.of());
		JsonNode roles = response.path("roles");
		if (!roles.isArray()) {
			throw new StrapiClientException(
				"Strapi roles response has no roles array: " + response
			);
		}

		for (JsonNode role : roles) {
			if ("authenticated".equals(role.path("type").asText())) {
				int roleId = role.path("id").asInt(-1);
				if (roleId > 0) {
					LOG.infof(
						"Resolved Strapi authenticated role id=%d name=%s",
						roleId,
						role.path("name").asText("Authenticated")
					);
					return roleId;
				}
			}
		}

		throw new StrapiClientException(
			"Strapi role with type \"authenticated\" not found"
		);
	}

	public void setAuthenticatedRoleId(int roleId) {
		if (roleId <= 0) {
			throw new IllegalArgumentException("authenticatedRoleId must be positive");
		}
		authenticatedRoleId = roleId;
	}

	public void clearAuthenticatedRoleId() {
		authenticatedRoleId = -1;
	}

	public record StrapiMemberSnapshot(
		String documentId,
		int id,
		int cId,
		Optional<String> username,
		Optional<String> email,
		Optional<Boolean> publishMyData
	) {
		StrapiUserRef toUserRef() {
			return new StrapiUserRef(documentId, id);
		}

		private static Optional<StrapiMemberSnapshot> fromJson(JsonNode member) {
			Optional<StrapiUserRef> userRef = StrapiUserRef.fromJson(member);
			if (userRef.isEmpty()) {
				return Optional.empty();
			}

			return Optional.of(new StrapiMemberSnapshot(
				userRef.get().documentId(),
				userRef.get().numericId(),
				member.path("cId").asInt(-1),
				StrapiResponseReader.readTextField(member, "username"),
				StrapiResponseReader.readTextField(member, "email"),
				StrapiResponseReader.readBooleanField(member, "publishMyData")
			));
		}
	}

	public record UpsertResult(UpsertAction action, String documentId) {
		public enum UpsertAction {
			CREATED,
			UPDATED
		}
	}

	public Collection<StrapiMemberSnapshot> fetchAllMembers() {
		int pageSize = config.strapi().pageSize();
		Collection<StrapiMemberSnapshot> members = new ArrayList<>();
		int page = 1;

		Set<Integer> cIds = new HashSet<>();
		
		while (true) {
			Log.info("fetching user from strapi - page #"+page);
			JsonNode response = client.listAllPaginated(StrapiResources.USERS, page, pageSize);
			JsonNode items = StrapiResponseReader.readResultItems(response);
			if (items == null || items.isEmpty()) {
				break;
			}

			for (JsonNode item : items) {
				Optional<StrapiMemberSnapshot> snapshot = StrapiMemberSnapshot.fromJson(item);
				if (snapshot.isEmpty()) {
					continue;
				}

				StrapiMemberSnapshot member = snapshot.get();
				if (member.cId() > 0) {
					members.add(member);
					cIds.add(member.cId);
				}
			}

			if (!StrapiResponseReader.hasNextPage(response, page, items.size(), pageSize)) {
				break;
			}
			page++;
			client.delayBetweenRequests();
		}
		
		for(int cId: cIds) {
			long n=members.stream().filter(m -> m.cId==cId).count();
			if(n>1) Log.errorf("für cId=%d wurden %d member gefunden.", cId, n);
		}

		LOG.infof(
			"Fetched %d members from Strapi",
			members.size()
		);
		return members;
	}

	public void setCsvMembers(List<Member> members) {
		this.csvMembersByCid = members != null
			? members.stream().collect(Collectors.toMap(Member::cId, member -> member, (left, right) -> left))
			: Map.of();
	}

	public Optional<String> resolveOwnerKennelName(int ownerCId) {
		Member csvMember = csvMembersByCid.get(ownerCId);
		if (csvMember != null) {
			Optional<String> name = StrapiPayloadMapper.formatOwnerKennelName(
				csvMember.firstName(),
				csvMember.lastName()
			);
			if (name.isPresent()) {
				return name;
			}
		}

		JsonNode response = client.list(
			StrapiResources.USERS,
			Map.of(
				"filters[cId][$eq]", Integer.toString(ownerCId),
				"fields[0]", "firstName",
				"fields[1]", "lastName"
			)
		);
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return Optional.empty();
		}

		JsonNode user = items.get(0);
		return StrapiPayloadMapper.formatOwnerKennelName(
			StrapiResponseReader.readTextField(user, "firstName"),
			StrapiResponseReader.readTextField(user, "lastName")
		);
	}

	private record OwnerMemberRef(
		int userId,
		int cId,
		Optional<Boolean> publishMyData
	) {
	}

	public void ensureOwnerMembersPublishMyDataBeforeBreederSave(
		int breederCId,
		Optional<Integer> connectingOwnerCId
	) {
		for (OwnerMemberRef owner : fetchBreederOwnerMembers(breederCId)) {
			ensurePublishMyDataForUser(owner);
		}
		connectingOwnerCId.ifPresent(this::ensurePublishMyDataForBreederOwner);
	}

	public void ensurePublishMyDataForBreederOwner(int cId) {
		StrapiMemberSnapshot snapshot = membersByCid.get(cId);
		if (snapshot != null && snapshot.publishMyData().orElse(false)) {
			return;
		}

		if (snapshot != null) {
			updateUserPublishMyData(snapshot.id(), cId, snapshot.documentId());
			return;
		}

		Optional<StrapiUserRef> userRef = client.findUserRefByCId(cId);
		if (userRef.isEmpty()) {
			LOG.warnf(
				"Cannot set publishMyData=true for breeder owner cId=%d: Strapi user not found",
				cId
			);
			return;
		}

		updateUserPublishMyData(
			userRef.get().numericId(),
			cId,
			userRef.get().documentId()
		);
	}

	private void ensurePublishMyDataForUser(OwnerMemberRef owner) {
		if (owner.publishMyData().orElse(false)) {
			return;
		}
		updateUserPublishMyData(owner.userId(), owner.cId(), null);
	}

	private void updateUserPublishMyData(int userId, int cId, String documentId) {
		client.updateUser(userId, Map.of("publishMyData", true));
		LOG.infof(
			"Updated Strapi user publishMyData=true for breeder owner cId=%d userId=%d documentId=%s",
			cId,
			userId,
			documentId != null ? documentId : "?"
		);
	}

	private List<OwnerMemberRef> fetchBreederOwnerMembers(int breederCId) {
		Map<String, String> query = new LinkedHashMap<>();
		query.put("filters[cId][$eq]", Integer.toString(breederCId));
		query.put("populate[owner_members][fields][0]", "id");
		query.put("populate[owner_members][fields][1]", "cId");
		query.put("populate[owner_members][fields][2]", "publishMyData");
		query.put("populate[member][fields][0]", "id");
		query.put("populate[member][fields][1]", "cId");
		query.put("populate[member][fields][2]", "publishMyData");

		JsonNode response = client.list(StrapiResources.BREEDERS, query);
		JsonNode items = StrapiResponseReader.readResultItems(response);
		if (items == null || items.isEmpty()) {
			return List.of();
		}

		JsonNode breeder = items.get(0);
		Map<Integer, OwnerMemberRef> ownersByUserId = new LinkedHashMap<>();
		for (OwnerMemberRef owner : parseOwnerMembers(breeder.path("owner_members"))) {
			ownersByUserId.put(owner.userId(), owner);
		}
		parseOwnerMember(breeder.path("member")).ifPresent(owner ->
			ownersByUserId.putIfAbsent(owner.userId(), owner)
		);
		return List.copyOf(ownersByUserId.values());
	}

	private List<OwnerMemberRef> parseOwnerMembers(JsonNode ownerMembers) {
		if (ownerMembers == null || ownerMembers.isNull()) {
			return List.of();
		}

		JsonNode array = ownerMembers.isArray() ? ownerMembers : ownerMembers.path("data");
		if (!array.isArray()) {
			return List.of();
		}

		List<OwnerMemberRef> result = new ArrayList<>();
		for (JsonNode owner : array) {
			parseOwnerMember(owner).ifPresent(result::add);
		}
		return result;
	}

	private Optional<OwnerMemberRef> parseOwnerMember(JsonNode owner) {
		if (owner == null || owner.isNull() || owner.isMissingNode()) {
			return Optional.empty();
		}

		Optional<Integer> userId = StrapiResponseReader.readNumericId(owner);
		if (userId.isEmpty()) {
			return Optional.empty();
		}

		return Optional.of(new OwnerMemberRef(
			userId.get(),
			owner.path("cId").asInt(-1),
			StrapiResponseReader.readBooleanField(owner, "publishMyData")
		));
	}

	public void setImportCache(Collection<StrapiMemberSnapshot> members) {
		this.membersByCid = members != null 
				? members.stream().collect(Collectors.toMap(m -> m.cId, m -> m)) 
				: Map.of();
		this.membersByUsername = members !=null
				? members.stream().filter(m -> m.username()!=null && m.username().isPresent()).collect(Collectors.toMap(m -> m.username().get(), m -> m))
				: Map.of();
	}

	public void clearImportCache() {
		membersByCid = Map.of();
		membersByUsername = Map.of();
		csvMembersByCid = Map.of();
		authenticatedRoleId = -1;
	}

	public UpsertResult upsert(Member member) {
		if (authenticatedRoleId <= 0) {
			throw new StrapiClientException(
				"Authenticated Strapi role not resolved; call setAuthenticatedRoleId first"
			);
		}

		//resolveDuplicateEmails(member);

		Optional<StrapiUserRef> existingUser = findExistingStrapiUser(member);
		Optional<StrapiMemberSnapshot> ucid = findExistingUserRefByCId(member.cId());
		if(existingUser.isEmpty()) existingUser = ucid.isEmpty() ? Optional.empty() : Optional.of(ucid.get().toUserRef());
		if(existingUser.isEmpty()) existingUser = findExistingStrapiByUsername(member);
		boolean isCreate = existingUser.isEmpty();
		Map<String, Object> payload = StrapiPayloadMapper.toUserInput(
			member,
			config,
			isCreate,
			authenticatedRoleId
		);

		if (existingUser.isPresent()) {
			StrapiUserRef userRef = existingUser.get();
//			LOG.infof(
//				"Update Strapi user cId=%d documentId=%s numericId=%d email=%s",
//				member.cId(),
//				userRef.documentId(),
//				userRef.numericId(),
//				member.strapiEmail()
//			);
			client.updateUser(userRef.numericId(), payload);
			return new UpsertResult(UpsertResult.UpsertAction.UPDATED, userRef.documentId());
		}

//		LOG.infof(
//			"Create Strapi user cId=%d username=%s email=%s",
//			member.cId(),
//			member.username(),
//			member.strapiEmail()
//		);
		JsonNode response = client.create(StrapiResources.USERS, payload, false);
		String documentId = client.readDocumentId(response)
			.orElseGet(() -> StrapiResponseReader.readResourceId(response).orElse(null));
		if (documentId == null || documentId.isBlank()) {
			throw new StrapiClientException("Strapi user create returned no documentId");
		}
		LOG.infof("Created Strapi user cId=%d documentId=%s", member.cId(), documentId);
		return new UpsertResult(UpsertResult.UpsertAction.CREATED, documentId);
	}

	public void setEmail(int cId, String email) {
		Optional<StrapiMemberSnapshot> u = this.findExistingUserRefByCId(cId);
		if(u==null || u.isEmpty()) return;
		
		client.updateUser(u.get().id(), Map.of("email", email));
//		LOG.infof(
//			"Updated Strapi user email cId=%d documentId=%s to %s",
//			cId,
//			u.get().documentId(),
//			email
//		);
	}

	public boolean upsertBreeder(Member member, String memberDocumentId) {
		if (!member.isBreeder()) {
			return false;
		}

		ensureOwnerMembersPublishMyDataBeforeBreederSave(
			member.cId(),
			Optional.of(member.cId())
		);

		Optional<String> existingBreederId = client.findDocumentIdByCId(
			StrapiResources.BREEDERS,
			member.cId()
		);
		Optional<String> kennelName = member.breedingStation();
		Map<String, Object> payload = StrapiPayloadMapper.toBreederInput(
			member.cId(),
			kennelName,
			existingBreederId.isEmpty(),
			member.isActiveBreeder(),
			Optional.of(memberDocumentId)
		);

		if (existingBreederId.isPresent()) {
			client.update(
				StrapiResources.BREEDERS,
				existingBreederId.get(),
				payload,
				true
			);
			//LOG.infof("Updated breeder cId=%d documentId=%s", member.cId(), existingBreederId.get());
			return false;
		}

		client.create(StrapiResources.BREEDERS, payload, true);
		//LOG.infof("Created breeder cId=%d for member documentId=%s", member.cId(), memberDocumentId);
		return true;
	}

	private Optional<StrapiUserRef> findExistingStrapiUser(Member member) {
		if (member.hasStrapiIdentity()) {
			return Optional.of(new StrapiUserRef(
				member.documentId(),
				member.id()
			));
		}
		return Optional.empty();
	}

	private Optional<StrapiUserRef> findExistingStrapiByUsername(Member member) {
		return Optional.empty();
	}

	private Optional<StrapiMemberSnapshot> findExistingUserRefByCId(int cId) {
		StrapiMemberSnapshot cachedMember = membersByCid.get(cId);
		if (cachedMember != null) {
			return Optional.of(cachedMember);
		} else return Optional.empty();
	}

}
