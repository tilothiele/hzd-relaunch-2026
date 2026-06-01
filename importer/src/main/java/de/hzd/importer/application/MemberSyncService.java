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
			if(!member.isActive()) {
				
			}
			AuthentikUserAdapter.UpsertResult authentikResult = importInAuthentik
				? authentikUserAdapter.upsert(member)
				: AuthentikUserAdapter.UpsertResult.SKIPPED;
			if (!importInAuthentik) {
				LOG.debugf(
					"Skipping Authentik sync for cId=%d: cFlagBreeder is not true",
					member.cId()
				);
			}
			

				return authentikResult == UpsertResult.CREATED
					? SyncResult.CREATED
					: SyncResult.UPDATED;
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
