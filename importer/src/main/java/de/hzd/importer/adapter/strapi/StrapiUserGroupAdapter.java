package de.hzd.importer.adapter.strapi;

import com.fasterxml.jackson.databind.JsonNode;
import de.hzd.importer.domain.UserGroup;
import de.hzd.importer.infrastructure.config.ImporterConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StrapiUserGroupAdapter {

	private static final Logger LOG = Logger.getLogger(StrapiUserGroupAdapter.class);

	@Inject
	StrapiRestClient client;

	@Inject
	ImporterConfig config;

	private Map<Integer, UserGroup> groupsById = Map.of();

	public UserGroup getUserGroupById(int id) {
		return groupsById.get(id);
	}

	public void setImportCache(Collection<UserGroup> groups) {
		this.groupsById = groups != null
			? groups.stream()
				.filter(group -> group != null && group.id() != UserGroup.UNDEFINED_ID)
				.collect(Collectors.toMap(
					UserGroup::id,
					group -> group,
					(left, right) -> left
				))
			: Map.of();
	}

	public void clearImportCache() {
		groupsById = Map.of();
	}

	public List<UserGroup> fetchAll() {
		int pageSize = config.strapi().pageSize();
		List<UserGroup> groups = new ArrayList<>();
		int page = 1;

		while (true) {
			Map<String, String> query = new LinkedHashMap<>();
			query.put("sort[0]", "Name:asc");
			query.put("fields[0]", "Name");
			JsonNode response = client.listAllPaginated(
				StrapiResources.USER_GROUPS,
				page,
				pageSize,
				query
			);
			List<UserGroup> pageItems = StrapiUserGroupMapper.fromCollectionResponse(response);
			if (pageItems.isEmpty()) {
				break;
			}

			groups.addAll(pageItems);
			if (!StrapiResponseReader.hasNextPage(response, page, pageItems.size(), pageSize)) {
				break;
			}
			page++;
			client.delayBetweenRequests();
		}

		LOG.infof("Fetched %d user groups from Strapi", groups.size());
		return List.copyOf(groups);
	}
}
