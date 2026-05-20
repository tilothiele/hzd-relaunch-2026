import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import userAdminSchema from './extensions/graphql/config/schema.graphql';
import { sanitizeUser, sanitizeUsers } from './utils/user-sanitize';

const USER_CT_UID = 'plugin::users-permissions.user';
const USER_GRAPHQL_NON_SCALAR_ATTRS = new Set([
	'relation',
	'media',
	'component',
	'dynamiczone',
]);

function canBypassUsersPermissionsPublishGate(context: any) {
	const state = context?.state ?? context?.koaContext?.state;
	if (!state) {
		return false;
	}
	const { user, auth } = state;
	return (
		user?.isSuperAdmin === true ||
		auth?.strategy?.name === 'api-token'
	);
}

/**
 * Strikte Sichtbarkeit für UsersPermissionsUser über alle Pfade (Liste, Einzelabruf,
 * Populate): PII nur bei publishMyData === true. UsersPermissionsMe bleibt unverändert.
 * Super-Admin / API-Token sehen weiterhin volle User-Daten (z. B. updateUserAdmin).
 */
function buildUsersPermissionsUserPublishAwareResolvers(strapi: Core.Strapi) {
	const model = strapi.getModel(USER_CT_UID);
	const resolvers: Record<string, { resolve: (parent: any, args: any, context: any) => any }> =
		{};

	for (const [attrName, rawAttr] of Object.entries(model.attributes)) {
		const attr = rawAttr as { type?: string; private?: boolean };
		if (attrName === 'id' || attrName === 'documentId') {
			continue;
		}
		if (attr.private) {
			continue;
		}
		if (attr.type && USER_GRAPHQL_NON_SCALAR_ATTRS.has(attr.type)) {
			continue;
		}

		if (attrName === 'publishMyData') {
			resolvers[attrName] = {
				resolve: (parent: any) =>
					parent?.publishMyData === undefined ||
					parent?.publishMyData === null
						? null
						: parent.publishMyData,
			};
			continue;
		}

		resolvers[attrName] = {
			resolve: (parent: any, _args: any, context: any) => {
				if (canBypassUsersPermissionsPublishGate(context)) {
					const value = parent[attrName];
					return value === undefined ? null : value;
				}
				if (parent?.publishMyData !== true) {
					return null;
				}
				const value = parent[attrName];
				return value === undefined ? null : value;
			},
		};
	}

	return resolvers;
}

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
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');
    const usersPermissionsUserPublishResolvers =
      buildUsersPermissionsUserPublishAwareResolvers(strapi);
    const usersPermissionsUserPublishResolversConfig = Object.fromEntries(
      Object.keys(usersPermissionsUserPublishResolvers).map((field) => [
        `UsersPermissionsUser.${field}`,
        { auth: false },
      ]),
    );

    extensionService.use({
      typeDefs: `
        ${userAdminSchema.typeDefs}
        extend type UsersPermissionsMe {
          firstName: String
          lastName: String
          address1: String
          address2: String
          countryCode: String
          zip: String
          city: String
          phone: String
          locationLat: Float
          locationLng: Float
        }

        extend type UsersPermissionsUser {
          firstName: String
          lastName: String
          address1: String
          address2: String
          countryCode: String
          zip: String
          city: String
          phone: String
          locationLat: Float
          locationLng: Float
         }
      `,

      resolvers: {
        ...userAdminSchema.resolvers,
        UsersPermissionsMe: {
          firstName: {
            resolve: (parent: any) => parent.firstName || null,
          },
          lastName: {
            resolve: (parent: any) => parent.lastName || null,
          },
          address1: {
            resolve: (parent: any) => parent.address1 || null,
          },
          address2: {
            resolve: (parent: any) => parent.address2 || null,
          },
          countryCode: {
            resolve: (parent: any) => parent.countryCode || null,
          },
          zip: {
            resolve: (parent: any) => parent.zip || null,
          },
          city: {
            resolve: (parent: any) => parent.city || null,
          },
          phone: {
            resolve: (parent: any) => parent.phone || null,
          },
          locationLat: {
            resolve: (parent: any) => parent.locationLat || null,
          },
          locationLng: {
            resolve: (parent: any) => parent.locationLng || null,
          },
        },
        UsersPermissionsUser: usersPermissionsUserPublishResolvers,
      },
      resolversConfig: {
        ...userAdminSchema.resolversConfig,
        // The me query itself requires authentication (handled by the original resolver)
        // Extended fields inherit auth from parent query
        'UsersPermissionsMe.firstName': { auth: false },
        'UsersPermissionsMe.lastName': { auth: false },
        'UsersPermissionsMe.address1': { auth: false },
        'UsersPermissionsMe.address2': { auth: false },
        'UsersPermissionsMe.countryCode': { auth: false },
        'UsersPermissionsMe.zip': { auth: false },
        'UsersPermissionsMe.city': { auth: false },
        'UsersPermissionsMe.phone': { auth: false },
        'UsersPermissionsMe.locationLat': { auth: false },
        'UsersPermissionsMe.locationLng': { auth: false },
        ...usersPermissionsUserPublishResolversConfig,

        'Query.usersPermissionsUsers': {
          middlewares: [
            async (resolve: any, parent: any, args: any, context: any, info: any) => {
              const result = await resolve(parent, args, context, info);
              return sanitizeUsers(result);
            }
          ]
        },
        'Query.usersPermissionsUsers_connection': {
          middlewares: [
            async (resolve: any, parent: any, args: any, context: any, info: any) => {
              const result = await resolve(parent, args, context, info);
              return sanitizeUsers(result);
            }
          ]
        },
        'Query.usersPermissionsUser': {
          middlewares: [
            async (resolve: any, parent: any, args: any, context: any, info: any) => {
              const result = await resolve(parent, args, context, info);
              return sanitizeUser(result);
            }
          ]
        }
      },
    });

    strapi.log.info('[GraphQL Extension] Registered UsersPermissionsMe/User extensions');

    // Document Service Middleware to manipulate user data
    strapi.documents.use(async (context, next) => {
      if (context.uid === 'plugin::users-permissions.user' && (context.action === 'create' || context.action === 'update')) {
        const data = (context.params as any).data;

        console.log('[Document Middleware] User data manipulation middleware', { uid: context.uid, action: context.action, data });
        if (data) {
          // Set DisplayName
          const firstName = data.firstName?.trim() || '';
          const lastName = data.lastName?.trim() || '';
          const memberId = data.membershipNumber || '';
          if (firstName || lastName) {
            data.DisplayName = `${firstName} ${lastName}(${memberId})`.trim();
          }

          // Enrich with Geolocation
          if (typeof data.zip === 'string' && data.zip.trim() !== '') {
            const geo = strapi.plugin('hzd-plugin')?.service('geolocation');
            if (geo) {
              // Default to DE if not provided, for now.
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

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const enabled = strapi.config.get('admin.transfer.remote.enabled', true);
    strapi.log.info(
      `Remote data transfer is ${enabled ? 'ENABLED' : 'DISABLED'}`
    );
    const salt = strapi.config.get('admin.transfer.token.salt', '');
    strapi.log.info(
      `Remote data transfer salt is ${salt}`
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
