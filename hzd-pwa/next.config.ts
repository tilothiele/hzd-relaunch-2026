import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const pwaConfig = withPWA({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	// Versions-Check (analog frontend/PwaUpdater):
	// Eine neue SW-Version aktiviert sich NICHT automatisch, sondern wartet,
	// bis der Nutzer im PwaUpdater-Banner auf „Aktualisieren" klickt.
	// `skipWaiting: false` lässt die workbox-Vorlage den Standard-
	// "SKIP_WAITING"-Message-Handler generieren.
	// clientsClaim bleibt true, damit nach der Aktivierung controllerchange
	// feuert und die Seite neu geladen wird.
	// Offline-Caching (Precache/Fallbacks) bleibt dadurch unberührt.
	workboxOptions: {
		skipWaiting: false,
		clientsClaim: true,
	},
})

const nextConfig: NextConfig = {
	output: 'standalone',
	agentRules: false,
	experimental: {
		agentUpgrade: 'security',
	},
	serverExternalPackages: [
		'@prisma/client',
		'prisma',
		'jspdf',
		'nodemailer',
		'altcha-lib',
		'docxtemplater',
		'jszip',
	],
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
