import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
	return (
		<Suspense
			fallback={(
				<div className="flex flex-1 items-center justify-center text-sm text-gray-600">
					Anmeldung wird geladen…
				</div>
			)}
		>
			<LoginForm />
		</Suspense>
	)
}
