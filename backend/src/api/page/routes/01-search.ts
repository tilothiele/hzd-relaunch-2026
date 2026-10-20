export default {
	routes: [
		{
			method: 'POST',
			path: '/search/reindex',
			handler: 'page.reindex',
			config: {
				auth: false,
			},
		},
		{
			method: 'POST',
			path: '/search/webhook',
			handler: 'page.webhook',
			config: {
				auth: false,
			},
		},
	],
}
