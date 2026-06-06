package de.hzd.importer.application;

import java.util.Map;
import java.util.Optional;

import org.jboss.logging.Logger;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter;
import de.hzd.importer.adapter.authentik.AuthentikUserAdapter.AuthentikUserSnapshot;
import de.hzd.importer.adapter.authentik.AuthentikUserAdapter.UpsertResult;
import de.hzd.importer.adapter.strapi.StrapiMemberAdapter;
import de.hzd.importer.domain.Member;
import de.hzd.importer.port.MemberSyncPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class MemberSyncService implements MemberSyncPort {

	private static final Logger LOG = Logger.getLogger(MemberSyncService.class);

	@Inject
	AuthentikUserAdapter authentikUserAdapter;

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	@Override
	public SyncResult syncInAuthentik(Member member) {
		try {
			if (!member.doImportInAuthentik()) {
				return SyncResult.SKIPPED;
			}

			UpsertResult authentikResult = authentikUserAdapter.upsert(member);

			return switch (authentikResult) {
				case CREATED -> SyncResult.CREATED;
				case UPDATED -> SyncResult.UPDATED;
				case DELETED -> SyncResult.DELETED;
				default -> SyncResult.SKIPPED;
			};
		} catch (RuntimeException exception) {
			LOG.errorf(exception, "Failed to sync member cId=%d", member.cId());
			throw exception;
		}
	}

	@Override
	public SyncResult syncInStrapi(Member member) {
		try {
			StrapiMemberAdapter.UpsertResult strapiResult = strapiMemberAdapter.upsert(member);
			strapiMemberAdapter.upsertBreeder(member, strapiResult.documentId());

			return strapiResult.action() == StrapiMemberAdapter.UpsertResult.UpsertAction.CREATED
				? SyncResult.CREATED
				: SyncResult.UPDATED;
		} catch (RuntimeException exception) {
			LOG.errorf(exception, "Failed to sync member cId=%d", member.cId());
			throw exception;
		}
	}

	@Override
	public void setMemberEmailInStrapi(int cId, String email) {
		strapiMemberAdapter.setEmail(cId, email);
	}
}
