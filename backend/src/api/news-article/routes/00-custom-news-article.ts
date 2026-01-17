export default {
    routes: [
        {
            method: 'GET',
            path: '/news-articles/newArticlesNum',
            handler: 'news-article.newArticlesNum',
            config: {
                auth: false,
            },
        },
    ],
};
