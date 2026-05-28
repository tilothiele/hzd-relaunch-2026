import { NextRequest, NextResponse } from 'next/server'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'
import { deleteEntity, fetchEntityByDocumentId, fetchMe } from '@/lib/strapi/api'
import {
	deletePhotoboxRawFile,
	isPhotoboxWebDavConfigured,
} from '@/lib/server/photobox-webdav'

export const dynamic = 'force-dynamic'

const PHOTOBOX_IMAGE_POPULATE = new URLSearchParams({
	'populate[origin][fields][0]': 'documentId',
})

export async function POST(request: NextRequest) {
	try {
		const { documentId, token } = await request.json()

		if (!documentId || !token) {
			return NextResponse.json({ message: 'Document ID und Token erforderlich.' }, { status: 400 })
		}

		const baseUrl = getStrapiPublicBaseUrl()
		const meResult = await fetchMe(token, { server: true, baseUrl })
		const userDocumentId = meResult.me?.documentId

		if (!userDocumentId) {
			return NextResponse.json({ message: 'Nicht authentifiziert.' }, { status: 401 })
		}

		const photoboxImage = await fetchEntityByDocumentId<{
			S3Path?: string | null
			origin?: { documentId?: string } | null
		}>(
			'photobox-images',
			documentId,
			PHOTOBOX_IMAGE_POPULATE,
			{ server: true, baseUrl, token },
		)

		if (!photoboxImage) {
			return NextResponse.json({ message: 'Bild nicht gefunden.' }, { status: 404 })
		}

		if (photoboxImage.origin?.documentId !== userDocumentId) {
			return NextResponse.json({ message: 'Nicht berechtigt dieses Bild zu löschen.' }, { status: 403 })
		}

		const storageKey = photoboxImage.S3Path

		if (storageKey && isPhotoboxWebDavConfigured()) {
			try {
				console.log(`[PhotoBox Delete API] Deleting from WebDAV: ${storageKey}`)
				await deletePhotoboxRawFile(storageKey)
			} catch (webdavError) {
				console.error('[PhotoBox Delete API] WebDAV deletion failed:', webdavError)
			}
		}

		console.log(`[PhotoBox Delete API] Deleting Strapi record: ${documentId}`)
		await deleteEntity('photobox-images', documentId, { server: true, baseUrl, token })

		return NextResponse.json({ message: 'Bild erfolgreich gelöscht.' }, { status: 200 })

	} catch (error) {
		console.error('Error in PhotoBox delete API:', error)
		return NextResponse.json({
			message: 'Fehler beim Löschen des Bildes.',
			error: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
