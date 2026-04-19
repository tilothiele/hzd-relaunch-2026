import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import { GET_PHOTOBOX_IMAGE } from '@/lib/graphql/queries'
import { DELETE_PHOTOBOX_IMAGE } from '@/lib/graphql/mutations'
import {
	deletePhotoboxRawFile,
	isPhotoboxWebDavConfigured,
} from '@/lib/server/photobox-webdav'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const { documentId, token } = await request.json()

		if (!documentId || !token) {
			return NextResponse.json({ message: 'Document ID und Token erforderlich.' }, { status: 400 })
		}

		const gqlEndpoint = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`
		const gqlClient = new GraphQLClient(gqlEndpoint, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		const meResult = await gqlClient.request<{ me: { documentId: string } }>(`
            query { me { documentId } }
        `)
		const userDocumentId = meResult.me.documentId

		const { photoboxImage } = await gqlClient.request<{ photoboxImage: {
			S3Path?: string | null
			origin?: { documentId?: string } | null
		} | null }>(GET_PHOTOBOX_IMAGE, {
			documentId: documentId,
		})

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
		await gqlClient.request(DELETE_PHOTOBOX_IMAGE, {
			documentId: documentId,
		})

		return NextResponse.json({ message: 'Bild erfolgreich gelöscht.' }, { status: 200 })

	} catch (error) {
		console.error('Error in PhotoBox delete API:', error)
		return NextResponse.json({
			message: 'Fehler beim Löschen des Bildes.',
			error: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
