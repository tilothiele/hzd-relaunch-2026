import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  if (strapi.plugin('graphql')) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use({
      typeDefs: `
        type GeoLocationResult {
          lat: Float
          lng: Float
        }

        extend type Query {
          getGeoLocationByCountryCode(zip: String!, countryCode: String!): GeoLocationResult
        }
      `,
      resolvers: {
        Query: {
          getGeoLocationByCountryCode: {
            resolve: async (_parent, args, context) => {
              const { zip, countryCode } = args;
              const service = strapi.plugin('hzd-plugin').service('geolocation');
              return await service.getGeoLocationByZip(zip, countryCode);
            },
            auth: {
              scope: ['plugin::hzd-plugin.geolocation.getGeoLocationByZip'] // reuse the controller action scope if possible, or define generally
            }
          },
        },
      },
      resolversConfig: {
        'Query.getGeoLocationByCountryCode': {
          auth: false, // Make it public as per previous logic, or consistent with controller
        },
      },
    });
  }
};

export default register;
