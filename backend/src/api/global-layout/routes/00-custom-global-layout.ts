export default {
	routes: [
		{
			method: 'GET',
			path: '/global-layout/website',
			handler: 'global-layout.website',
			config: {
				auth: false,
			},
		},
	],
}
