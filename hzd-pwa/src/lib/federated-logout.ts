import { signOut } from 'next-auth/react'

interface FederatedLogoutResponse {
	endSessionUrl?: string | null
	postLogoutRedirectUri?: string
}

export async function performFederatedLogout(
	postLogoutRedirectUri = `${window.location.origin}/login`,
): Promise<void> {
	let endSessionUrl: string | null = null
	let redirectUri = postLogoutRedirectUri

	try {
		const response = await fetch('/api/auth/federated-logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ postLogoutRedirectUri }),
			cache: 'no-store',
		})

		if (response.ok) {
			const payload = await response.json() as FederatedLogoutResponse
			endSessionUrl = typeof payload.endSessionUrl === 'string'
				? payload.endSessionUrl
				: null
			if (typeof payload.postLogoutRedirectUri === 'string') {
				redirectUri = payload.postLogoutRedirectUri
			}
		}
	} catch (error) {
		console.error('[Auth] Federated logout preparation failed', error)
	}

	await signOut({ redirect: false })

	if (endSessionUrl) {
		window.location.assign(endSessionUrl)
		return
	}

	window.location.assign(redirectUri)
}
