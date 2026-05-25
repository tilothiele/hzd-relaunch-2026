const jwt = require('jsonwebtoken')
const { createPublicKey } = require('crypto')

interface AuthentikClaims {
	sub?: string
	preferred_username?: string
	email?: string
	given_name?: string
	family_name?: string
	name?: string
	[key: string]: unknown
}

interface OpenIdConfiguration {
	jwks_uri?: string
	issuer?: string
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

function getAudience(): string | null {
	return process.env.AUTHENTIK_AUDIENCE?.trim()
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

async function fetchJwksUri(issuer: string): Promise<string> {
	const configuredJwksUri = process.env.AUTHENTIK_JWKS_URI?.trim()
	if (configuredJwksUri) {
		return configuredJwksUri
	}

	const response = await fetch(`${issuer}/.well-known/openid-configuration`)
	if (!response.ok) {
		throw new Error(
			`Authentik OpenID configuration failed: ${response.status} ${response.statusText}`,
		)
	}

	const configuration = (await response.json()) as OpenIdConfiguration
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

function verifyToken(token: string): Promise<AuthentikClaims> {
	const issuer = getIssuer()
	if (!issuer) {
		throw new Error('AUTHENTIK_ISSUER is not configured')
	}

	const issuerCandidates = [issuer, `${issuer}/`]
	const audience = getAudience()

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
					.map((algorithm) => algorithm.trim())
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

function readClaim(claims: AuthentikClaims, claimName: string): string | null {
	const value = claims[claimName]
	return typeof value === 'string' && value.trim().length > 0
		? value.trim()
		: null
}

function createFallbackEmail(username: string, subject: string): string {
	const normalizedUsername = username.replace(/[^a-zA-Z0-9._-]/g, '-')
	const normalizedSubject = subject.replace(/[^a-zA-Z0-9._-]/g, '-')
	return `${normalizedUsername || normalizedSubject}@authentik.local`
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

async function findOrCreateUser(strapi: any, claims: AuthentikClaims) {
	const username = readClaim(claims, getUsernameClaim())
		|| readClaim(claims, 'preferred_username')
		|| readClaim(claims, 'sub')

	if (!username) {
		throw new Error('Authentik token does not contain a usable username claim')
	}

	strapi.log.info('[Authentik Auth] Token accepted', {
		username,
		hasEmail: Boolean(readClaim(claims, getEmailClaim()) || readClaim(claims, 'email')),
		issuer: typeof claims.iss === 'string' ? claims.iss : undefined,
		audience: claims.aud,
	})

	const existingUser = await strapi.db
		.query('plugin::users-permissions.user')
		.findOne({
			where: { username },
			populate: ['role'],
		})

	if (existingUser) {
		if (existingUser.blocked) {
			throw new Error(`Strapi user "${username}" is blocked`)
		}

		return existingUser
	}

	const subject = readClaim(claims, 'sub') || username
	const email = readClaim(claims, getEmailClaim())
		|| readClaim(claims, 'email')
		|| createFallbackEmail(username, subject)
	const role = await findAuthenticatedRole(strapi)

	const createdUser = await strapi.db
		.query('plugin::users-permissions.user')
		.create({
			data: {
				username,
				email,
				provider: 'authentik',
				confirmed: true,
				blocked: false,
				role: role.id,
				firstName: readClaim(claims, 'given_name'),
				lastName: readClaim(claims, 'family_name'),
			},
			populate: ['role'],
		})

	strapi.log.info(`[Authentik Auth] Created Strapi user "${username}"`)

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

	strapi.log.info('[Authentik Auth] Bearer token received')

	const claims = await verifyToken(token)
	const user = await findOrCreateUser(strapi, claims)

	return {
		id: user.id,
	}
}
