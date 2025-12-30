import type { Metadata } from 'next'
import Script from 'next/script';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import { Providers } from './providers'
import { TestBanner } from '@/components/test-banner/test-banner'

import { cookies } from 'next/headers'
import type { ThemeId } from '@/themes'

config.autoAddCss = false

export const metadata: Metadata = {
	title: 'HZD - Hovawart Zuchtverein Deutschland',
	description: 'Herzlich willkommen bei der HZD - Hovawart Zuchtverein Deutschland',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const cookieStore = await cookies()
	const themeId = (cookieStore.get('hzd-theme')?.value as ThemeId) || 'A'
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
	const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL

	return (
		<html lang='de' data-theme={themeId}>
			<head>
				{umamiWebsiteId && umamiScriptUrl && (
					<Script
						src={`${umamiScriptUrl}`}
						data-website-id={`${umamiWebsiteId}`}
						defer
						strategy="afterInteractive"
					/>
				)}
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
