package de.hzd.importer.port;

import de.hzd.importer.domain.Member;

public interface MemberSyncPort {
	enum SyncResult {
		CREATED,
		UPDATED,
		SKIPPED
	}

	SyncResult syncInStrapi(Member member);

	SyncResult syncInAuthentik(Member member);

	void setMemberEmailInStrapi(int cId, String email);
}
