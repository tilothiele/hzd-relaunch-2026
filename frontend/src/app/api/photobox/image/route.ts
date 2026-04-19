import { NextRequest, NextResponse } from 'next/server'
import {
	getPhotoboxRawFile,
	guessContentTypeFromKey,
	isPhotoboxWebDavConfigured,
} from '@/lib/server/photobox-webdav'

/** `request.url` / Query-Parameter → Route muss dynamisch sein (nicht statisch prerendern). */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		if (!isPhotoboxWebDavConfigured()) {
			return NextResponse.json(
				{
					message:
						'PhotoBox-Rohspeicher (OpenCloud WebDAV) ist nicht konfiguriert ' +
						'(PHOTOBOX_WEBDAV_URL).',
				},
				{ status: 503 },
			)
		}

		const { searchParams } = new URL(request.url)
		const rawPath = searchParams.get('path')

		if (!rawPath) {
			return NextResponse.json({ message: 'Pfad fehlt.' }, { status: 400 })
		}

		let storageKey = rawPath
		if (rawPath.startsWith('http')) {
			try {
				const url = new URL(rawPath)
				storageKey = url.pathname
			} catch (e) {
				console.error('[PhotoBox Image Proxy] Failed to parse URL:', rawPath)
			}
		}

		storageKey = decodeURIComponent(storageKey)

		if (storageKey.startsWith('/')) {
			storageKey = storageKey.substring(1)
		}

		console.log(`[PhotoBox Image Proxy] Fetching WebDAV key: "${storageKey}" (Original: "${rawPath}")`)

		const buffer = await getPhotoboxRawFile(storageKey)

		console.log(`[PhotoBox Image Proxy] Success: ${storageKey} (${buffer.length} bytes)`)

		const contentType = guessContentTypeFromKey(storageKey)

		return new NextResponse(new Uint8Array(buffer), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})

	} catch (error) {
		console.error('[PhotoBox Image Proxy] Error:', error)
		return NextResponse.json({
			message: 'Fehler beim Laden des Bildes.',
			error: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
