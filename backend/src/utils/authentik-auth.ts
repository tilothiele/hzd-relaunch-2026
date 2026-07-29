const jwt = require('jsonwebtoken')
const { createPublicKey } = require('crypto')

interface AuthentikClaims {
	sub?: string
	preferred_username?: string
	email?: string
	given_name?: string
	family_name?: string
	name?: string
	username?: string
	[key: string]: unknown
}

interface OpenIdConfiguration {
	jwks_uri?: string
	issuer?: string
	introspection_endpoint?: string
}

interface IntrospectionResponse {
	active?: boolean
	sub?: string
	username?: string
	preferred_username?: string
	email?: string
	given_name?: string
	family_name?: string
	name?: string
	iss?: string
	aud?: string | string[]
	[key: string]: unknown
}

interface Jwk {
	kid?: string
	kty?: string
	use?: string
	alg?: string
	[key: string]: unknown
}

interface JsonWebKeySet {
	keys?: Jwk[]
}

let openIdConfigPromise: Promise<OpenIdConfiguration> | null = null
let jwksUriPromise: Promise<string> | null = null
let jwksPromise: Promise<JsonWebKeySet> | null = null
let jwksFetchedAt = 0
const jwksMaxAgeMs = 10 * 60 * 1000

function trimTrailingSlash(value: string): string {
	return value.trim().replace(/\/$/, '')
}

function getIssuer(): string | null {
	const issuer = process.env.AUTHENTIK_ISSUER?.trim()
	return issuer ? trimTrailingSlash(issuer) : null
}

function getAuthentikClientId(): string | null {
	return process.env.AUTHENTIK_CLIENT_ID?.trim() || null
}

function getAuthentikClientSecret(): string | null {
	return process.env.AUTHENTIK_CLIENT_SECRET?.trim() || null
}

export function isConfidentialAuthentikClient(): boolean {
	return Boolean(getAuthentikClientSecret())
}

function getAudience(): string | null {
	return process.env.AUTHENTIK_AUDIENCE?.trim()
		|| getAuthentikClientId()
		|| null
}

function getUsernameClaim(): string {
	return process.env.AUTHENTIK_USERNAME_CLAIM?.trim() || 'preferred_username'
}

function getEmailClaim(): string {
	return process.env.AUTHENTIK_EMAIL_CLAIM?.trim() || 'email'
}

function getBearerToken(ctx: any): string | null {
	const authorization = ctx?.request?.header?.authorization

	if (typeof authorization !== 'string') {
		return null
	}

	const parts = authorization.split(/\s+/)
	if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
		return null
	}

	return parts[1]
}

function isAudienceValidationError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	return message.includes('audience')
		|| message.includes('jwt audience')
}

async function fetchOpenIdConfiguration(issuer: string): Promise<OpenIdConfiguration> {
	const response = await fetch(`${issuer}/.well-known/openid-configuration`)
	if (!response.ok) {
		throw new Error(
			`Authentik OpenID configuration failed: ${response.status} ${response.statusText}`,
		)
	}

	return response.json() as Promise<OpenIdConfiguration>
}

async function getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
	const issuer = getIssuer()
	if (!issuer) {
		throw new Error('AUTHENTIK_ISSUER is not configured')
	}

	if (!openIdConfigPromise) {
		openIdConfigPromise = fetchOpenIdConfiguration(issuer)
	}

	return openIdConfigPromise
}

async function fetchJwksUri(issuer: string): Promise<string> {
	const configuredJwksUri = process.env.AUTHENTIK_JWKS_URI?.trim()
	if (configuredJwksUri) {
		return configuredJwksUri
	}

	const configuration = await getOpenIdConfiguration()
	if (!configuration.jwks_uri) {
		throw new Error('Authentik OpenID configuration does not contain jwks_uri')
	}

	return configuration.jwks_uri
}

async function getJwks() {
	const issuer = getIssuer()
	if (!issuer) {
		throw new Error('AUTHENTIK_ISSUER is not configured')
	}

	if (!jwksUriPromise) {
		jwksUriPromise = fetchJwksUri(issuer)
	}

	const now = Date.now()
	if (!jwksPromise || now - jwksFetchedAt > jwksMaxAgeMs) {
		jwksFetchedAt = now
		jwksPromise = fetch(await jwksUriPromise)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(
						`Authentik JWKS fetch failed: ${response.status} ${response.statusText}`,
					)
				}

				return response.json() as Promise<JsonWebKeySet>
			})
	}

	return jwksPromise
}

async function getSigningKey(header: any): Promise<string> {
	if (!header?.kid) {
		throw new Error('Authentik token header does not contain kid')
	}

	const jwks = await getJwks()
	const key = jwks.keys?.find((candidate) => candidate.kid === header.kid)

	if (!key) {
		jwksPromise = null
		const refreshedJwks = await getJwks()
		const refreshedKey = refreshedJwks.keys?.find((candidate) => candidate.kid === header.kid)

		if (!refreshedKey) {
			throw new Error(`Authentik signing key not found for kid "${header.kid}"`)
		}

		return createPublicKey({
			key: refreshedKey,
			format: 'jwk',
		}).export({
			type: 'spki',
			format: 'pem',
		}) as string
	}

	return createPublicKey({
		key,
		format: 'jwk',
	}).export({
		type: 'spki',
		format: 'pem',
	}) as string
}

function verifyTokenWithAudience(
	token: string,
	audience: string | null,
): Promise<AuthentikClaims> {
	const issuer = getIssuer()
	if (!issuer) {
		throw new Error('AUTHENTIK_ISSUER is not configured')
	}

	const issuerCandidates = [issuer, `${issuer}/`]

	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			(header: any, callback: (error: Error | null, key?: string) => void) => {
				getSigningKey(header)
					.then((key) => callback(null, key))
					.catch((error) => callback(error))
			},
			{
				algorithms: (process.env.AUTHENTIK_JWT_ALGORITHMS || 'RS256')
					.split(',')
					.map((algorithm: string) => algorithm.trim())
					.filter(Boolean),
				issuer: issuerCandidates,
				...(audience ? { audience } : {}),
			},
			(error: Error | null, decoded: unknown) => {
				if (error) {
					reject(error)
					return
				}

				if (!decoded || typeof decoded !== 'object') {
					reject(new Error('Authentik token payload is empty'))
					return
				}

				resolve(decoded as AuthentikClaims)
			},
		)
	})
}

async function verifyToken(token: string): Promise<AuthentikClaims> {
	const audience = getAudience()

	try {
		return await verifyTokenWithAudience(token, audience)
	} catch (error) {
		if (audience && isAudienceValidationError(error)) {
			return verifyTokenWithAudience(token, null)
		}

		throw error
	}
}

function mapIntrospectionToClaims(payload: IntrospectionResponse): AuthentikClaims {
	return {
		sub: payload.sub,
		preferred_username: payload.preferred_username
			|| payload.username
			|| undefined,
		email: payload.email,
		given_name: payload.given_name,
		family_name: payload.family_name,
		name: payload.name,
		iss: payload.iss,
		aud: payload.aud,
	}
}

async function getIntrospectionEndpoint(): Promise<string> {
	const configured = process.env.AUTHENTIK_INTROSPECTION_URL?.trim()
	if (configured) {
		return configured
	}

	const configuration = await getOpenIdConfiguration()
	if (!configuration.introspection_endpoint) {
		throw new Error(
			'Authentik OpenID configuration does not contain introspection_endpoint',
		)
	}

	return configuration.introspection_endpoint
}

async function introspectToken(token: string): Promise<AuthentikClaims> {
	const clientId = getAuthentikClientId()
	const clientSecret = getAuthentikClientSecret()

	if (!clientId || !clientSecret) {
		throw new Error(
			'AUTHENTIK_CLIENT_ID and AUTHENTIK_CLIENT_SECRET are required for token introspection',
		)
	}

	const introspectionEndpoint = await getIntrospectionEndpoint()
	const response = await fetch(introspectionEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			token,
			client_id: clientId,
			client_secret: clientSecret,
		}),
	})

	if (!response.ok) {
		throw new Error(
			`Authentik token introspection failed: ${response.status} ${response.statusText}`,
		)
	}

	const payload = (await response.json()) as IntrospectionResponse
	if (!payload.active) {
		throw new Error('Authentik token introspection returned inactive token')
	}

	return mapIntrospectionToClaims(payload)
}

async function resolveClaims(token: string): Promise<AuthentikClaims> {
	try {
		return await verifyToken(token)
	} catch (jwtError) {
		if (!isConfidentialAuthentikClient()) {
			throw jwtError
		}

		try {
			return await introspectToken(token)
		} catch (introspectionError) {
			const jwtMessage = jwtError instanceof Error
				? jwtError.message
				: String(jwtError)
			const introspectionMessage = introspectionError instanceof Error
				? introspectionError.message
				: String(introspectionError)

			throw new Error(
				`Authentik JWT verification failed (${jwtMessage}); `
				+ `introspection failed (${introspectionMessage})`,
			)
		}
	}
}

function readClaim(claims: AuthentikClaims, claimName: string): string | null {
	const value = claims[claimName]
	return typeof value === 'string' && value.trim().length > 0
		? value.trim()
		: null
}

function readNumericClaim(claims: AuthentikClaims, claimName: string): number | null {
	const value = claims[claimName]
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		return Number.parseInt(value.trim(), 10)
	}
	return null
}

function createFallbackEmail(username: string, subject: string): string {
	const normalizedUsername = username.replace(/[^a-zA-Z0-9._-]/g, '-')
	const normalizedSubject = subject.replace(/[^a-zA-Z0-9._-]/g, '-')
	return `${normalizedUsername || normalizedSubject}@authentik.local`
}

function parseCIdFromUsername(username: string): number | null {
	const match = /^c\.(\d+)$/i.exec(username.trim())
	if (!match) {
		return null
	}

	return Number.parseInt(match[1], 10)
}

function resolveClaimEmail(claims: AuthentikClaims): string | null {
	return readClaim(claims, getEmailClaim()) || readClaim(claims, 'email')
}

function resolveClaimCId(claims: AuthentikClaims, username: string): number | null {
	return readNumericClaim(claims, 'cId')
		|| readNumericClaim(claims, 'c_id')
		|| readNumericClaim(claims, 'hzd_cid')
		|| parseCIdFromUsername(username)
}

async function findAuthenticatedRole(strapi: any) {
	const role = await strapi.db
		.query('plugin::users-permissions.role')
		.findOne({ where: { type: 'authenticated' } })

	if (!role) {
		throw new Error('Strapi users-permissions role "authenticated" not found')
	}

	return role
}

async function findUserByUsername(strapi: any, username: string) {
	return strapi.db.query('plugin::users-permissions.user').findOne({
		where: { username },
		populate: ['role'],
	})
}

async function findUserByEmailOrCEmail(strapi: any, email: string) {
	const normalized = email.trim()
	if (!normalized) {
		return null
	}

	const byEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
		where: { email: normalized },
		populate: ['role'],
	})
	if (byEmail) {
		return byEmail
	}

	return strapi.db.query('plugin::users-permissions.user').findOne({
		where: { cEmail: normalized },
		populate: ['role'],
	})
}

async function findUserByCId(strapi: any, cId: number) {
	return strapi.db.query('plugin::users-permissions.user').findOne({
		where: { cId },
		populate: ['role'],
	})
}

function preferUserWithCId(primary: any | null, secondary: any | null) {
	if (primary && typeof primary.cId === 'number') {
		return primary
	}
	if (secondary && typeof secondary.cId === 'number') {
		return secondary
	}
	return primary || secondary || null
}

async function findExistingUser(strapi: any, claims: AuthentikClaims, username: string) {
	const email = resolveClaimEmail(claims)
	const cId = resolveClaimCId(claims, username)

	const byUsername = await findUserByUsername(strapi, username)
	const byEmail = email ? await findUserByEmailOrCEmail(strapi, email) : null
	const byCId = typeof cId === 'number' ? await findUserByCId(strapi, cId) : null

	// Importierte Mitglieder haben cId; frisch via Authentik angelegte Schatten-User nicht.
	const matched = preferUserWithCId(
		preferUserWithCId(byUsername, byEmail),
		byCId,
	)

	if (matched) {
		strapi.log.info('[Authentik Auth] Matched existing Strapi user', {
			matchedId: matched.id,
			matchedUsername: matched.username,
			hasCId: typeof matched.cId === 'number',
			viaUsername: Boolean(byUsername && byUsername.id === matched.id),
			viaEmail: Boolean(byEmail && byEmail.id === matched.id),
			viaCId: Boolean(byCId && byCId.id === matched.id),
		})
	}

	return matched
}

async function findOrCreateUser(strapi: any, claims: AuthentikClaims) {
	const username = readClaim(claims, getUsernameClaim())
		|| readClaim(claims, 'preferred_username')
		|| readClaim(claims, 'sub')

	if (!username) {
		throw new Error('Authentik token does not contain a usable username claim')
	}

	const email = resolveClaimEmail(claims)
	const cId = resolveClaimCId(claims, username)

	strapi.log.info('[Authentik Auth] Token accepted', {
		username,
		hasEmail: Boolean(email),
		cId,
		issuer: typeof claims.iss === 'string' ? claims.iss : undefined,
		audience: claims.aud,
		confidentialClient: isConfidentialAuthentikClient(),
	})

	const existingUser = await findExistingUser(strapi, claims, username)

	if (existingUser) {
		if (existingUser.blocked) {
			throw new Error(`Strapi user "${existingUser.username}" is blocked`)
		}

		return existingUser
	}

	const subject = readClaim(claims, 'sub') || username
	const role = await findAuthenticatedRole(strapi)

	const createdUser = await strapi.db
		.query('plugin::users-permissions.user')
		.create({
			data: {
				username,
				email: email || createFallbackEmail(username, subject),
				provider: 'authentik',
				confirmed: true,
				blocked: false,
				role: role.id,
				firstName: readClaim(claims, 'given_name'),
				lastName: readClaim(claims, 'family_name'),
				...(typeof cId === 'number' ? { cId } : {}),
				...(email ? { cEmail: email } : {}),
			},
			populate: ['role'],
		})

	strapi.log.info(`[Authentik Auth] Created Strapi user "${username}"`, {
		hasCId: typeof createdUser.cId === 'number',
	})

	return createdUser
}

export function isAuthentikAuthEnabled(): boolean {
	return Boolean(getIssuer())
}

export async function authenticateAuthentikBearerToken(strapi: any, ctx: any) {
	const token = getBearerToken(ctx)

	if (!token) {
		return null
	}

	strapi.log.info('[Authentik Auth] Bearer token received', {
		confidentialClient: isConfidentialAuthentikClient(),
		hasAudience: Boolean(getAudience()),
	})

	const claims = await resolveClaims(token)
	const user = await findOrCreateUser(strapi, claims)

	return {
		id: user.id,
	}
}
