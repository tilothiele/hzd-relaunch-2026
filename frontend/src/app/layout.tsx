import type { Metadata, Viewport } from 'next'
import Script from 'next/script';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import { Providers } from './providers'
import { TestBanner } from '@/components/test-banner/test-banner'


config.autoAddCss = false

export const viewport: Viewport = {
	themeColor: '#4560AA',
}

export const metadata: Metadata = {
	title: {
		default: 'Hovawart Zuchtgemeinschaft Deutschland e.V.',
		template: 'Hovawart Zuchtgemeinschaft Deutschland e.V. - %s',
	},
	description: 'Herzlich willkommen bei der Hovawart Zuchtgemeinschaft Deutschland e.V.',
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'HZD Hovawart',
	},
	icons: {
		icon: '/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png',
		shortcut: '/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png',
		apple: '/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png',
	},
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
	const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL

	return (
		<html lang='de'>
			<head>
				{umamiWebsiteId && umamiScriptUrl && (
					<Script
						src={`${umamiScriptUrl}`}
						data-website-id={`${umamiWebsiteId}`}
						defer
						strategy="afterInteractive"
					/>
				)}
				<meta name="application-name" content="HZD" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="HZD" />
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="theme-color" content="#4560AA" />
			</head>
			<body className='antialiased'>
				<TestBanner />
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	)
}
