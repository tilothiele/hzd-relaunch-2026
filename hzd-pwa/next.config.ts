import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const pwaConfig = withPWA({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	register: true,
	skipWaiting: true,
	runtimeCaching: [
		{
			urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico|css|js)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'static-assets',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60 * 24 * 30,
				},
			},
		},
		{
			urlPattern: /^\/wurfabnahmen\/[^/]+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'dynamic-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 60 * 60 * 24,
				},
			},
		},
		{
			urlPattern: /^\/koerungen\/[^/]+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'dynamic-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 60 * 60 * 24,
				},
			},
		},
		{
			urlPattern: /^https:\/\/.*hovawarte\.com\/api\/.*/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'api-cache',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60,
				},
			},
		},
	],
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
