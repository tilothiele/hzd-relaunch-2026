export default {
	routes: [
		{
			method: 'GET',
			path: '/news-articles/search',
			handler: 'news-article.search',
			config: {
				auth: false,
			},
		},
		{
			method: 'GET',
			path: '/news-articles/newArticlesNum',
			handler: 'news-article.newArticlesNum',
			config: {
				auth: false,
			},
		},
	],
}
