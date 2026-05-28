import withSerwistInit from '@serwist/next'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(
	readFileSync(new URL('./package.json', import.meta.url))
)

const withSerwist = withSerwistInit({
	swSrc: 'src/app/sw.ts',
	swDest: 'public/sw.js',
	reloadOnOnline: false,
	disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '1337',
				pathname: '/uploads/**',
			},
			{
				protocol: 'http',
				hostname: '127.0.0.1',
				port: '1337',
				pathname: '/uploads/**',
			},
		],
	},
	env: {
		NEXT_PUBLIC_APP_VERSION: pkg.version,
		NEXT_PUBLIC_BUILD_DATE: new Date().toLocaleDateString('de-DE'),
	},
	output: 'standalone'
}

export default withSerwist(nextConfig)