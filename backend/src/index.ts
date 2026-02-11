import type { Core } from '@strapi/strapi';
import userAdminSchema from './extensions/graphql/config/schema.graphql';


export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

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
        UsersPermissionsUser: {
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
        'UsersPermissionsUser.firstName': { auth: false },
        'UsersPermissionsUser.lastName': { auth: false },
        'UsersPermissionsUser.address1': { auth: false },
        'UsersPermissionsUser.address2': { auth: false },
        'UsersPermissionsUser.countryCode': { auth: false },
        'UsersPermissionsUser.zip': { auth: false },
        'UsersPermissionsUser.city': { auth: false },
        'UsersPermissionsUser.phone': { auth: false },
        'UsersPermissionsUser.locationLat': { auth: false },
        'UsersPermissionsUser.locationLng': { auth: false },
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
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const enabled = strapi.config.get('admin.transfer.remote.enabled', true);
    strapi.log.info(
      `Remote data transfer is ${enabled ? 'ENABLED' : 'DISABLED'}`
    );
    const salt = strapi.config.get('admin.transfer.token.salt', '');
    strapi.log.info(
      `Remote data transfer salt is ${salt}`
    );

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
