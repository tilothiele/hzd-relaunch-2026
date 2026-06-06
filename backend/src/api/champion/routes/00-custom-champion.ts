export default {
	routes: [
		{
			method: 'GET',
			path: '/champions/search',
			handler: 'champion.search',
			config: {
				auth: false,
			},
		},
	],
}
