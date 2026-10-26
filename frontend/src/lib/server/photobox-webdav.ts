import { AuthType, createClient, type WebDAVClient } from 'webdav'

const MAX_PATH_SEGMENT_LEN = 200

/**
 * Ein Pfadsegment für WebDAV (Ordner- oder Dateiname): keine Trenner,
 * keine Path-Traversal-Muster, keine typischen Sonderzeichen.
 */
export function sanitizePhotoboxPathSegment(
	raw: string,
	fallback: string,
): string {
	let s = raw.normalize('NFKC').trim()
	s = s.replace(/\0/g, '')
	s = s.replace(/\.\./g, '_')
	s = s.replace(/[/\\]/g, '_')
	s = s.replace(/[:*?"<>|\x00-\x1f]/g, '_')
	s = s.replace(/_+/g, '_')
	s = s.replace(/^[\s._]+|[\s._]+$/g, '')
	if (s.length > MAX_PATH_SEGMENT_LEN) {
		s = s.slice(0, MAX_PATH_SEGMENT_LEN)
	}
	s = s.replace(/^[\s._]+|[\s._]+$/g, '')
	return s.length > 0 ? s : fallback
}

/**
 * Relativer Speicherpfad (Strapi-Feld S3Path):
 * `sanitizedUsername/sanitizedCollectionId/sanitizedDateiname`
 */
export function buildPhotoboxStorageKey(
	username: string,
	collectionDocumentId: string,
	fileName: string,
): string {
	const u = sanitizePhotoboxPathSegment(username, 'user')
	const c = sanitizePhotoboxPathSegment(collectionDocumentId, 'collection')
	const f = sanitizePhotoboxPathSegment(fileName, 'upload.jpg')
	return `${u}/${c}/${f}`
}

/**
 * Normalisiert den relativen Schlüssel zu einem absoluten WebDAV-Pfad.
 */
function normalizeRemotePath(relativeKey: string): string {
	const p = relativeKey.replace(/\\/g, '/').replace(/^\/+/, '')
	return `/${p}`
}

function parentDir(absolutePath: string): string {
	const trimmed = absolutePath.replace(/\/$/, '')
	const last = trimmed.lastIndexOf('/')
	if (last <= 0) {
		return '/'
	}
	return trimmed.slice(0, last) || '/'
}

let clientSingleton: WebDAVClient | null = null

/**
 * Basic-Auth nach RFC 7617 (UTF-8). Der webdav-Client kodiert das
 * Passwort als Latin-1; Hetzner antwortet darauf mit 401, sobald
 * Zeichen wie §, ß oder ° vorkommen.
 */
function basicAuthHeader(username: string, password: string): string {
	const token = Buffer.from(`${username}:${password}`, 'utf8').toString(
		'base64',
	)
	return `Basic ${token}`
}

function getClient(): WebDAVClient {
	if (clientSingleton) {
		return clientSingleton
	}
	const url = process.env.PHOTOBOX_WEBDAV_URL?.trim()
	if (!url) {
		throw new Error(
			'PHOTOBOX_WEBDAV_URL ist nicht gesetzt (OpenCloud-WebDAV-Basisordner).',
		)
	}
	const username = process.env.PHOTOBOX_WEBDAV_USERNAME?.trim() ?? ''
	const password = process.env.PHOTOBOX_WEBDAV_PASSWORD ?? ''
	const headers: Record<string, string> = {}
	if (username.length > 0 || password.length > 0) {
		headers.Authorization = basicAuthHeader(username, password)
	}
	clientSingleton = createClient(url.replace(/\/$/, ''), {
		authType: AuthType.None,
		headers,
	})
	return clientSingleton
}

export function isPhotoboxWebDavConfigured(): boolean {
	return Boolean(process.env.PHOTOBOX_WEBDAV_URL?.trim())
}

export async function putPhotoboxRawFile(
	relativeKey: string,
	body: Buffer,
	contentType: string,
): Promise<void> {
	const client = getClient()
	const path = normalizeRemotePath(relativeKey)
	const dir = parentDir(path)
	if (dir !== '/') {
		await client.createDirectory(dir, { recursive: true })
	}
	await client.putFileContents(path, body, {
		overwrite: true,
		headers: {
			'Content-Type': contentType,
		},
	})
}

export async function getPhotoboxRawFile(relativeKey: string): Promise<Buffer> {
	const client = getClient()
	const path = normalizeRemotePath(relativeKey)
	const data = await client.getFileContents(path, { format: 'binary' })
	return data as Buffer
}

export async function deletePhotoboxRawFile(relativeKey: string): Promise<void> {
	const client = getClient()
	const path = normalizeRemotePath(relativeKey)
	await client.deleteFile(path)
}

export function guessContentTypeFromKey(relativeKey: string): string {
	const lower = relativeKey.toLowerCase()
	if (lower.endsWith('.png')) {
		return 'image/png'
	}
	if (lower.endsWith('.webp')) {
		return 'image/webp'
	}
	if (lower.endsWith('.gif')) {
		return 'image/gif'
	}
	return 'image/jpeg'
}
