import Link from 'next/link'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { LogoutButton } from '@/components/LogoutButton'
import { UserLabel } from '@/components/UserLabel'
import { OnlineIndicator } from '@/components/OnlineIndicator'

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen flex-col font-[family-name:var(--font-geist-sans)] text-[var(--color-kapitaensblau)]">
			<header className="app-shell-header flex w-full items-center justify-between p-4 shadow-sm z-10 relative bg-[var(--color-goldbeige)] text-[var(--color-kapitaensblau)]">
				<div className="flex items-center gap-3">
					<Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
						<Image
							src="/android/android-launchericon-192-192.png"
							alt="Logo"
							width={48}
							height={48}
							className="h-12 w-12 rounded-lg"
							priority
						/>
						<span className="text-xl font-bold hidden sm:block">HZD-App</span>
					</Link>
					<OnlineIndicator />
				</div>

				<Navigation />

				<div className="flex items-center gap-4">
					<UserLabel />
					<LogoutButton />
				</div>
			</header>

			<main className="app-shell-main flex flex-1 flex-col p-4 sm:p-8">
				{children}
			</main>

			<Footer />
		</div>
	)
}
