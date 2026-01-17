/**
 * news-article controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::news-article.news-article', ({ strapi }) => ({
    async newArticlesNum(ctx) {
        const { category, timestamp } = ctx.query;

        if (!category) {
            return ctx.badRequest('Category is required');
        }

        try {
            const count = await strapi
                .service('api::news-article.news-article')
                .countNewArticles(category, timestamp);

            return { count };
        } catch (error) {
            strapi.log.error(error);
            return ctx.internalServerError('An error occurred while counting articles');
        }
    },
}));
