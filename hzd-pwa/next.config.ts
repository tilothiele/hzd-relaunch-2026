import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const pwaConfig = withPWA({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
	output: 'standalone',
	async rewrites() {
		return [
			{
				source: '/uploads/:path*',
				destination: `${process.env.STRAPI_BASE_URL}/uploads/:path*`,
			},
		]
	},
}

export default pwaConfig(nextConfig)
