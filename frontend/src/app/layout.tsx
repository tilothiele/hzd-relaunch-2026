import type { Metadata } from 'next'
import Script from 'next/script';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import { Providers } from './providers'
import { TestBanner } from '@/components/test-banner/test-banner'

config.autoAddCss = false

export const metadata: Metadata = {
	title: 'HZD - Hovawart Zuchtverein Deutschland',
	description: 'Herzlich willkommen bei der HZD - Hovawart Zuchtverein Deutschland',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
	const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL

	console.log('umamiWebsiteId', umamiWebsiteId)
	console.log('umamiScriptUrl', umamiScriptUrl)

	return (
		<html lang='de'>
			<head>
 	 	 	 	{umamiWebsiteId && umamiScriptUrl && (
 	 	 	 	<Script
         	 	  src="`${umamiScriptUrl}`"
         	 	  data-website-id="`${umamiWebsiteId}`"
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
