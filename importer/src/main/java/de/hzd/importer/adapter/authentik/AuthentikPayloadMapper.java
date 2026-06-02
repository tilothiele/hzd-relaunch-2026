package de.hzd.importer.adapter.authentik;

import de.hzd.importer.domain.Member;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class AuthentikPayloadMapper {

	private AuthentikPayloadMapper() {
	}

	static Map<String, Object> toUserPayload(
		Member member,
		AuthentikGroupMapper groupMapper,
		List<String> groupNames
	) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("username", member.username());
		payload.put("email", member.authentikEmail());
		member.displayName().ifPresent(name -> payload.put("name", name));
		payload.put("is_active", member.isActive());

		List<String> groupUuids = groupMapper.uuidsForNames(groupNames);
		if (!groupUuids.isEmpty()) {
			payload.put("groups", groupUuids);
		}

		return payload;
	}
}
