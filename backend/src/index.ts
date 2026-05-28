import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

type RelationValue = number | string | { id?: number | string; documentId?: string };

function extractRelationIds(value: unknown): Array<number | string> {
	if (!value) {
		return [];
	}

	const values = Array.isArray(value) ? value : [value];
	return values
		.map((entry) => {
			if (typeof entry === 'number' || typeof entry === 'string') {
				return entry;
			}

			if (entry && typeof entry === 'object') {
				const relation = entry as { id?: number | string; documentId?: string };
				return relation.id ?? relation.documentId;
			}

			return null;
		})
		.filter((id): id is number | string => id !== null && id !== undefined);
}

async function findUsersByRelationIds(ids: Array<number | string>) {
	const numericIds = ids.filter((id): id is number => typeof id === 'number');
	const documentIds = ids.filter((id): id is string => typeof id === 'string');
	const users: any[] = [];

	if (numericIds.length > 0) {
		users.push(...await strapi.db.query('plugin::users-permissions.user').findMany({
			where: { id: { $in: numericIds } },
			select: ['id', 'documentId', 'firstName', 'lastName', 'email', 'publishMyData'],
		}));
	}

	if (documentIds.length > 0) {
		users.push(...await strapi.db.query('plugin::users-permissions.user').findMany({
			where: { documentId: { $in: documentIds } },
			select: ['id', 'documentId', 'firstName', 'lastName', 'email', 'publishMyData'],
		}));
	}

	return users;
}

function getOwnerMembersRelationPayload(data: any) {
	const relation = data?.owner_members;
	if (!relation || typeof relation !== 'object' || Array.isArray(relation)) {
		return {
			connectIds: extractRelationIds(relation),
			disconnectIds: [],
			setIds: null,
		};
	}

	return {
		connectIds: extractRelationIds(relation.connect),
		disconnectIds: extractRelationIds(relation.disconnect),
		setIds: relation.set ? extractRelationIds(relation.set) : null,
	};
}

async function getExistingOwnerMembers(breederId?: number | string) {
	if (!breederId) {
		return [];
	}

	const breeder = await strapi.db.query('plugin::hzd-plugin.breeder').findOne({
		where: { id: breederId },
		populate: {
			owner_members: {
				select: ['id', 'documentId', 'firstName', 'lastName', 'email', 'publishMyData'],
			},
		},
	});

	return breeder?.owner_members ?? [];
}

function createUserLabel(user: any): string {
	const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
	return displayName || user.email || user.documentId || `User ${user.id}`;
}

async function validateBreederOwnerMembersPublishMyData(event: any) {
	const data = event.params.data ?? {};
	const breederId = event.params.where?.id;
	const existingOwnerMembers = await getExistingOwnerMembers(breederId);
	const { connectIds, disconnectIds, setIds } = getOwnerMembersRelationPayload(data);
	const connectedUsers = await findUsersByRelationIds(connectIds);
	const setUsers = setIds ? await findUsersByRelationIds(setIds) : null;
	const disconnectIdSet = new Set(disconnectIds.map(String));
	const usersToValidate = setUsers ?? [
		...existingOwnerMembers.filter((user: any) =>
			!disconnectIdSet.has(String(user.id)) &&
			!disconnectIdSet.has(String(user.documentId))),
		...connectedUsers,
	];
	const uniqueUsers = Array.from(
		new Map(usersToValidate.map((user: any) => [String(user.id), user])).values(),
	);
	const invalidUsers = uniqueUsers.filter((user: any) => user.publishMyData !== true);

	if (invalidUsers.length > 0) {
		const names = invalidUsers.map(createUserLabel).join(', ');
		throw new errors.ValidationError(
			`Breeder kann nicht gespeichert werden. Alle verknüpften Owner-Members müssen "publishMyData" aktiviert haben. Betroffen: ${names}`,
		);
	}
}

async function setMissingBreederRoles(strapi: Core.Strapi) {
	const knex = strapi.db.connection;
	const hasTable = await knex.schema.hasTable('breeders');
	if (!hasTable) {
		return;
	}

	const hasColumn = await knex.schema.hasColumn('breeders', 'breeder_role');
	if (!hasColumn) {
		return;
	}

	const updatedRows = await knex('breeders')
		.whereNull('breeder_role')
		.update({
			breeder_role: 'B',
		});

	if (updatedRows > 0) {
		strapi.log.info(`[Bootstrap] Set missing breeder_role to B for ${updatedRows} breeders`);
	}
}

export default {
	register({ strapi }: { strapi: Core.Strapi }) {
		strapi.documents.use(async (context, next) => {
			if (context.uid === 'plugin::users-permissions.user' && (context.action === 'create' || context.action === 'update')) {
				const data = (context.params as any).data;

				if (data) {
					const firstName = data.firstName?.trim() || '';
					const lastName = data.lastName?.trim() || '';
					const memberId = data.membershipNumber || '';
					if (firstName || lastName) {
						data.DisplayName = `${firstName} ${lastName}(${memberId})`.trim();
					}

					if (typeof data.zip === 'string' && data.zip.trim() !== '') {
						const geo = strapi.plugin('hzd-plugin')?.service('geolocation');
						if (geo) {
							const countryCode = data.countryCode || 'DE';
							const result = await geo.getGeoLocationByZip(data.zip, countryCode);
							if (result) {
								data.locationLat = result.lat;
								data.locationLng = result.lng;
							}
						}
					}
				}
			}

			return next();
		});
		strapi.log.info('[Document Middleware] Registered User data manipulation middleware');
	},

	async bootstrap({ strapi }: { strapi: Core.Strapi }) {
		const enabled = strapi.config.get('admin.transfer.remote.enabled', true);
		strapi.log.info(
			`Remote data transfer is ${enabled ? 'ENABLED' : 'DISABLED'}`,
		);
		const salt = strapi.config.get('admin.transfer.token.salt', '');
		strapi.log.info(
			`Remote data transfer salt is ${salt}`,
		);

		strapi.db.lifecycles.subscribe({
			models: ['plugin::hzd-plugin.breeder'],
			async beforeCreate(event) {
				await validateBreederOwnerMembersPublishMyData(event);
			},
			async beforeUpdate(event) {
				await validateBreederOwnerMembersPublishMyData(event);
			},
		});

		await setMissingBreederRoles(strapi);

		const uid = 'api::form-instance.form-instance';

		try {
			const docService = strapi.documents(uid);

			if (docService) {
				const originalCreate = docService.create.bind(docService);

				docService.create = async (params: any) => {
					const result = await originalCreate(params);

					try {
						if (result && result.documentId) {
							await strapi.service(uid).sendConfirmationEmail(result.documentId);
						}
					} catch (err) {
						strapi.log.error('Error sending confirmation email in document service extension', err);
					}

					return result;
				};
				strapi.log.info('[Bootstrap] Extended form-instance document service with email logic');
			}
		} catch (error) {
			strapi.log.error('Failed to extend form-instance document service', error);
		}
	},
};
