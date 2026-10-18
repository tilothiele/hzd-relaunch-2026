'use client'

import Image from 'next/image'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { sanitizeCallbackUrl } from '@/lib/auth-login'

export function LoginForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const {
		login,
		isAuthenticating,
		authError,
		isAuthenticated,
		isInitialized,
	} = useAuth()
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [formError, setFormError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const redirectTo = sanitizeCallbackUrl(searchParams.get('callbackUrl'))
	const sessionExpired = searchParams.get('error') === 'SessionExpired'
	const visibleError = formError
		?? authError
		?? (sessionExpired
			? 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
			: null)

	useEffect(() => {
		if (isInitialized && isAuthenticated) {
			router.replace(redirectTo)
		}
	}, [isAuthenticated, isInitialized, redirectTo, router])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setFormError(null)
		setIsSubmitting(true)

		try {
			await login(identifier, password)
			router.replace(redirectTo)
			router.refresh()
		} catch (submitError) {
			setFormError(
				submitError instanceof Error
					? submitError.message
					: 'Anmeldung fehlgeschlagen.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isBusy = isSubmitting || isAuthenticating || !isInitialized

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
						HZD-App · Strapi
					</p>
				</div>

				{visibleError && (
					<div
						role="alert"
						className="text-center text-sm text-red-600 dark:text-red-400"
					>
						{visibleError}
					</div>
				)}

				<form
					className="space-y-4"
					onSubmit={(event) => void handleSubmit(event)}
				>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
						E-Mail oder Benutzername
						<input
							required
							autoComplete="username"
							name="identifier"
							value={identifier}
							onChange={(event) => setIdentifier(event.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
					</label>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
						Passwort
						<input
							required
							type="password"
							autoComplete="current-password"
							name="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
					</label>
					<button
						type="submit"
						disabled={isBusy}
						className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
					>
						{isBusy ? 'Anmeldung…' : 'Anmelden'}
					</button>
				</form>
			</div>
		</div>
	)
}
