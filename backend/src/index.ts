import type { Core } from '@strapi/strapi';

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
        extend type UsersPermissionsMe {
          firstName: String
          lastName: String
          address1: String
          address2: String
          countryCode: String
          zip: String
          city: String
          phone: String
          geoLocation: ComponentBreedingGeoLocation
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
          geoLocation: ComponentBreedingGeoLocation
        }
      `,
      resolvers: {
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
          geoLocation: {
            resolve: (parent: any) => parent.geoLocation || null,
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
          geoLocation: {
            resolve: (parent: any) => parent.geoLocation || null,
          },
        },
      },
      resolversConfig: {
        // The me query itself requires authentication (handled by the original resolver)
        // Extended fields inherit auth from parent query
        'UsersPermissionsMe.firstName': {
          auth: false, // Inherit auth from parent query
        },
        'UsersPermissionsMe.lastName': {
          auth: false,
        },
        'UsersPermissionsMe.address1': {
          auth: false,
        },
        'UsersPermissionsMe.address2': {
          auth: false,
        },
        'UsersPermissionsMe.countryCode': {
          auth: false,
        },
        'UsersPermissionsMe.zip': {
          auth: false,
        },
        'UsersPermissionsMe.city': {
          auth: false,
        },
        'UsersPermissionsMe.phone': {
          auth: false,
        },
        'UsersPermissionsMe.geoLocation': {
          auth: false,
        },
        'UsersPermissionsUser.firstName': {
          auth: false,
        },
        'UsersPermissionsUser.lastName': {
          auth: false,
        },
        'UsersPermissionsUser.address1': {
          auth: false,
        },
        'UsersPermissionsUser.address2': {
          auth: false,
        },
        'UsersPermissionsUser.countryCode': {
          auth: false,
        },
        'UsersPermissionsUser.zip': {
          auth: false,
        },
        'UsersPermissionsUser.city': {
          auth: false,
        },
        'UsersPermissionsUser.phone': {
          auth: false,
        },
        'UsersPermissionsUser.geoLocation': {
          auth: false,
        },
      },
    });

    strapi.log.info('[GraphQL Extension] Registered UsersPermissionsMe/User extensions');
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
