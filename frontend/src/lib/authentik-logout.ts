interface OpenIdConfiguration {
	end_session_endpoint?: string
	revocation_endpoint?: string
}

let openIdConfigPromise: Promise<OpenIdConfiguration> | null = null

function trimTrailingSlash(value: string): string {
	return value.trim().replace(/\/$/, '')
}

function getIssuer(): string {
	return trimTrailingSlash(process.env.AUTHENTIK_ISSUER ?? '')
}

function getClientId(): string {
	return process.env.AUTHENTIK_CLIENT_ID?.trim() ?? ''
}

function getClientSecret(): string {
	return process.env.AUTHENTIK_CLIENT_SECRET?.trim() ?? ''
}

function getNextAuthPublicUrl(): string {
	return trimTrailingSlash(process.env.NEXTAUTH_URL ?? '')
}

export function getAuthSecret(): string | undefined {
	return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
}

export function getPostLogoutRedirectUri(override?: string): string {
	const configured = process.env.AUTHENTIK_POST_LOGOUT_REDIRECT_URI?.trim()
	if (configured) {
		return configured
	}

	if (override?.trim()) {
		return override.trim()
	}

	const baseUrl = getNextAuthPublicUrl()
	return baseUrl ? `${baseUrl}/` : '/'
}

async function fetchOpenIdConfiguration(): Promise<OpenIdConfiguration> {
	const issuer = getIssuer()
	if (!issuer) {
		throw new Error('AUTHENTIK_ISSUER is not configured')
	}

	if (!openIdConfigPromise) {
		openIdConfigPromise = fetch(`${issuer}/.well-known/openid-configuration`, {
			cache: 'no-store',
		}).then(async (response) => {
			if (!response.ok) {
				throw new Error(
					`Authentik OpenID configuration failed: ${response.status} ${response.statusText}`,
				)
			}

			return response.json() as Promise<OpenIdConfiguration>
		})
	}

	return openIdConfigPromise
}

async function getEndSessionEndpoint(): Promise<string> {
	const configured = process.env.AUTHENTIK_END_SESSION_URL?.trim()
	if (configured) {
		return configured
	}

	const configuration = await fetchOpenIdConfiguration()
	if (!configuration.end_session_endpoint) {
		throw new Error(
			'Authentik OpenID configuration does not contain end_session_endpoint',
		)
	}

	return configuration.end_session_endpoint
}

async function getRevocationEndpoint(): Promise<string> {
	const configured = process.env.AUTHENTIK_REVOCATION_URL?.trim()
	if (configured) {
		return configured
	}

	const configuration = await fetchOpenIdConfiguration()
	if (!configuration.revocation_endpoint) {
		throw new Error(
			'Authentik OpenID configuration does not contain revocation_endpoint',
		)
	}

	return configuration.revocation_endpoint
}

function buildTokenRequestBody(
	params: Record<string, string>,
): URLSearchParams {
	const body = new URLSearchParams(params)
	const clientSecret = getClientSecret()

	if (clientSecret) {
		body.set('client_secret', clientSecret)
	}

	return body
}

export async function revokeAuthentikToken(
	token: string,
	tokenTypeHint: 'refresh_token' | 'access_token',
): Promise<void> {
	const clientId = getClientId()
	if (!clientId) {
		throw new Error('AUTHENTIK_CLIENT_ID is not configured')
	}

	const revocationEndpoint = await getRevocationEndpoint()
	const response = await fetch(revocationEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: buildTokenRequestBody({
			token,
			token_type_hint: tokenTypeHint,
			client_id: clientId,
		}),
		cache: 'no-store',
	})

	if (!response.ok) {
		const errorBody = await response.text()
		throw new Error(
			`Authentik token revocation failed: ${response.status} ${errorBody}`,
		)
	}
}

export async function buildAuthentikEndSessionUrl(options: {
	idTokenHint?: string
	postLogoutRedirectUri: string
}): Promise<string> {
	const endSessionEndpoint = await getEndSessionEndpoint()
	const params = new URLSearchParams({
		post_logout_redirect_uri: options.postLogoutRedirectUri,
	})

	const idTokenHint = options.idTokenHint?.trim()
	if (idTokenHint) {
		params.set('id_token_hint', idTokenHint)
	} else {
		const clientId = getClientId()
		if (clientId) {
			params.set('client_id', clientId)
		}
	}

	return `${endSessionEndpoint}?${params.toString()}`
}

export async function prepareAuthentikLogout(options: {
	idToken?: string
	refreshToken?: string
	accessToken?: string
	postLogoutRedirectUri?: string
}): Promise<string | null> {
	const issuer = getIssuer()
	if (!issuer) {
		return null
	}

	const postLogoutRedirectUri = getPostLogoutRedirectUri(
		options.postLogoutRedirectUri,
	)

	if (options.refreshToken) {
		try {
			await revokeAuthentikToken(options.refreshToken, 'refresh_token')
		} catch (error) {
			console.warn('[authentik] refresh token revocation failed', error)
		}
	}

	if (options.accessToken) {
		try {
			await revokeAuthentikToken(options.accessToken, 'access_token')
		} catch (error) {
			console.warn('[authentik] access token revocation failed', error)
		}
	}

	try {
		return await buildAuthentikEndSessionUrl({
			idTokenHint: options.idToken,
			postLogoutRedirectUri,
		})
	} catch (error) {
		console.warn('[authentik] end session URL could not be built', error)
		return null
	}
}
