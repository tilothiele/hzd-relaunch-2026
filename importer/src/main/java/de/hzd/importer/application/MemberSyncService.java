package de.hzd.importer.application;

import org.jboss.logging.Logger;

import de.hzd.importer.adapter.strapi.StrapiMemberAdapter;
import de.hzd.importer.domain.Member;
import de.hzd.importer.port.MemberSyncPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class MemberSyncService implements MemberSyncPort {

	private static final Logger LOG = Logger.getLogger(MemberSyncService.class);

	@Inject
	StrapiMemberAdapter strapiMemberAdapter;

	@Inject
	ImportHooks importHooks;

	@Override
	public SyncResult syncInStrapi(Member member) {
		try {
			if (!importHooks.needUpsertUser(member)) {
				return SyncResult.SKIPPED;
			}

			StrapiMemberAdapter.UpsertResult strapiResult = strapiMemberAdapter.upsert(member);
			if (importHooks.needUpsertBreeder(member)) {
				strapiMemberAdapter.upsertBreeder(member, strapiResult.documentId());
			}

			return strapiResult.action() == StrapiMemberAdapter.UpsertResult.UpsertAction.CREATED
				? SyncResult.CREATED
				: SyncResult.UPDATED;
		} catch (RuntimeException exception) {
			LOG.errorf(exception, "Failed to sync member cId=%d", member.cId());
			throw exception;
		}
	}


}
