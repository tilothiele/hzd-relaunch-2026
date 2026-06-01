package de.hzd.importer.adapter.strapi;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
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
	private Map<String, List<StrapiMemberSnapshot>> membersByEmail = Map.of();
	private Map<String, StrapiMemberSnapshot> membersByUsername = Map.of();
	private int authenticatedRoleId = -1;

	public List<StrapiMemberSnapshot> cachedMemberByEmail(String email) {
		return membersByEmail.get(email);
	}
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

	public void setImportCache(Collection<StrapiMemberSnapshot> members) {
		this.membersByCid = members != null 
				? members.stream().collect(Collectors.toMap(m -> m.cId, m -> m)) 
				: Map.of();
		this.membersByEmail = new HashMap<>();
		if(members!=null) {
			members.stream().filter(m -> m.email().isPresent() && m.email().get()!=null).forEach(m -> {
				List<StrapiMemberSnapshot> l = membersByEmail.get(m.email().get());
				if(l==null) {
					l = new ArrayList<>();
					membersByEmail.put(m.email().get(), l);
				}
				l.add(m);
			});
		}
		this.membersByUsername = members !=null
				? members.stream().filter(m -> m.username()!=null && m.username().isPresent()).collect(Collectors.toMap(m -> m.username().get(), m -> m))
				: Map.of();
	}

	public void clearImportCache() {
		membersByCid = Map.of();
		membersByEmail = Map.of();
		membersByUsername = Map.of();
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
			LOG.infof(
				"Update Strapi user cId=%d documentId=%s numericId=%d email=%s",
				member.cId(),
				userRef.documentId(),
				userRef.numericId(),
				member.strapiEmail()
			);
			client.updateUser(userRef.numericId(), payload);
			return new UpsertResult(UpsertResult.UpsertAction.UPDATED, userRef.documentId());
		}

		LOG.infof(
			"Create Strapi user cId=%d username=%s email=%s",
			member.cId(),
			member.username(),
			member.strapiEmail()
		);
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
		LOG.infof(
			"Updated Strapi user email cId=%d documentId=%s to %s",
			cId,
			u.get().documentId(),
			email
		);
	}

	public boolean upsertBreeder(Member member, String memberDocumentId) {
		if (!member.isBreeder()) {
			return false;
		}

		Optional<String> existingBreederId = client.findDocumentIdByCId(
			StrapiResources.BREEDERS,
			member.cId()
		);
		Optional<String> kennelName = member.breedingStation();
		Map<String, Object> payload = StrapiPayloadMapper.toBreederInput(
			member.cId(),
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
			LOG.infof("Updated breeder cId=%d documentId=%s", member.cId(), existingBreederId.get());
			return false;
		}

		client.create(StrapiResources.BREEDERS, payload, true);
		LOG.infof("Created breeder cId=%d for member documentId=%s", member.cId(), memberDocumentId);
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

	private List<StrapiMemberSnapshot> findExistingUserByEmail(Member member) {
		List<StrapiMemberSnapshot> u = membersByEmail.get(member.email());
		return u;
	}

	private Optional<StrapiMemberSnapshot> findExistingUserRefByCId(int cId) {
		StrapiMemberSnapshot cachedMember = membersByCid.get(cId);
		if (cachedMember != null) {
			return Optional.of(cachedMember);
		} else return Optional.empty();
	}

}
