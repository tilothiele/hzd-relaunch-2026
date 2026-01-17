/**
 * news-article service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::news-article.news-article', ({ strapi }) => ({
    async countNewArticles(categorySlug, timestamp) {
        const filters: any = {
            category: {
                Slug: categorySlug,
            },
            publishedAt: {
                $notNull: true,
            },
        };

        if (timestamp) {
            const date = new Date(timestamp);
            filters.$or = [
                {
                    DateOfPublication: {
                        $gt: date,
                    },
                },
                {
                    createdAt: {
                        $gt: date,
                    },
                },
            ];
        }

        const count = await strapi.entityService.count('api::news-article.news-article', {
            filters,
        });

        return count;
    },
}));
