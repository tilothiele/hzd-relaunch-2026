import type { Metadata } from 'next'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'

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
	return (
		<html lang='de'>
			<body className='antialiased'>
				{children}
			</body>
		</html>
	)
}
