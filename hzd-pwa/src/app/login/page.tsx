'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
	const router = useRouter()
	const { handleLogin, isAuthenticating, authError, isAuthenticated, isInitialized } = useAuth()

	useEffect(() => {
		if (isInitialized && isAuthenticated) {
			router.replace('/')
		}
	}, [isAuthenticated, isInitialized, router])

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[var(--color-goldbeige)]">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 sm:p-8">
				<div className="flex flex-col items-center">
					<Image
						src="/android/android-launchericon-192-192.png"
						alt="Logo"
						width={96}
						height={96}
						className="h-24 w-24 rounded-xl"
						priority
					/>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
						Anmelden
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						HZD-App · Authentik
					</p>
				</div>

				{authError && (
					<div className="text-center text-sm text-red-600 dark:text-red-400">
						{authError}
					</div>
				)}

				<button
					type="button"
					onClick={() => void handleLogin()}
					disabled={isAuthenticating || !isInitialized}
					className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
				>
					{isAuthenticating || !isInitialized
						? 'Weiterleitung…'
						: 'Mit Authentik anmelden'}
				</button>
			</div>
		</div>
	)
}
