import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'
import pkg from './package.json'

const withSerwist = withSerwistInit({
	swSrc: 'src/app/sw.ts',
	swDest: 'public/sw.js',
	reloadOnOnline: false,
	disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
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
	},
	output: 'standalone'
}

export default withSerwist(nextConfig)
