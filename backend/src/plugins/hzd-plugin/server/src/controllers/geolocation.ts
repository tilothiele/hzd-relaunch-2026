/**
 *  geolocation controller
 */

import { factories } from '@strapi/strapi';

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async getGeoLocationByZip(ctx) {
        const { countryCode, zip } = ctx.query;

        if (!countryCode || !zip) {
            return ctx.badRequest('countryCode and zip are required query parameters.');
        }

        try {
            const service = strapi.plugin('hzd-plugin').service('geolocation');
            const data = await service.getGeoLocationByZip(zip as string, countryCode as string);

            if (!data) {
                return ctx.notFound('Location not found');
            }

            ctx.body = data;
        } catch (err) {
            strapi.log.error('Error in getGeoLocationByZip controller', err);
            ctx.internalServerError('Internal server error');
        }
    }
});
