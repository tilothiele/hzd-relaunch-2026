package de.hzd.importer.application;

import java.util.Map;

import org.jboss.logging.Logger;

import de.hzd.importer.adapter.authentik.AuthentikUserAdapter;
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
			boolean importInAuthentik = member.doImportInAuthentik();
			AuthentikUserAdapter.UpsertResult authentikResult = importInAuthentik
				? authentikUserAdapter.upsert(member)
				: authentikUserAdapter.delete(member);
			if (!importInAuthentik) {
				LOG.debugf(
					"Deleting Authentik sync for cId=%d, username=%s, email=%s: cFlagBreeder is true",
					member.cId(),
					member.username(),
					member.email()
				);
			}
			
			switch(authentikResult) {
			case UpsertResult.CREATED: return SyncResult.CREATED;
			case UpsertResult.UPDATED: return SyncResult.UPDATED;
			case UpsertResult.DELETED: return SyncResult.DELETED;
			default: return SyncResult.SKIPPED;
			}
			
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
