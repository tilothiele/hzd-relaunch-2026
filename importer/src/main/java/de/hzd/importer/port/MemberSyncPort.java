package de.hzd.importer.port;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter.AuthentikUserSnapshot;
import de.hzd.importer.domain.Member;
import java.util.Map;

public interface MemberSyncPort {
	enum SyncResult {
		CREATED,
		UPDATED,
		DELETED,
		SKIPPED
	}

	SyncResult syncInStrapi(Member member);

	SyncResult syncInAuthentik(Member member);

	void setAuthentikUsersByUsername(Map<String, AuthentikUserSnapshot> users);

	void clearAuthentikUsersByUsername();

	void setMemberEmailInStrapi(int cId, String email);
}
