import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { GraphQLClient } from 'graphql-request'
import { GET_PHOTOBOX_IMAGE } from '@/lib/graphql/queries'
import { DELETE_PHOTOBOX_IMAGE } from '@/lib/graphql/mutations'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

// S3 Configuration
const s3Config = {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
        accessKeyId: process.env.S3_PHOTOBOX_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_PHOTOBOX_SECRET_KEY || '',
    },
    forcePathStyle: true,
}

const s3Client = new S3Client(s3Config)
const bucketName = process.env.S3_PHOTOBOX_BUCKET || ''

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

        // 1. Get current user to verify ownership
        const meResult = await gqlClient.request<{ me: { documentId: string } }>(`
            query { me { documentId } }
        `)
        const userDocumentId = meResult.me.documentId

        // 2. Fetch image details to get S3Path and check ownership
        const { photoboxImage } = await gqlClient.request<{ photoboxImage: any }>(GET_PHOTOBOX_IMAGE, {
            documentId: documentId
        })

        if (!photoboxImage) {
            return NextResponse.json({ message: 'Bild nicht gefunden.' }, { status: 404 })
        }

        if (photoboxImage.origin?.documentId !== userDocumentId) {
            return NextResponse.json({ message: 'Nicht berechtigt dieses Bild zu löschen.' }, { status: 403 })
        }

        const s3Path = photoboxImage.S3Path

        // 3. Delete from S3
        if (s3Path) {
            try {
                console.log(`[PhotoBox Delete API] Deleting from S3: ${s3Path}`)
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: s3Path,
                }))
            } catch (s3Error) {
                console.error('[PhotoBox Delete API] S3 deletion failed:', s3Error)
                // We continue even if S3 fails, to allow record deletion
            }
        }

        // 4. Delete Strapi Record
        console.log(`[PhotoBox Delete API] Deleting Strapi record: ${documentId}`)
        await gqlClient.request(DELETE_PHOTOBOX_IMAGE, {
            documentId: documentId
        })

        return NextResponse.json({ message: 'Bild erfolgreich gelöscht.' }, { status: 200 })

    } catch (error) {
        console.error('Error in PhotoBox delete API:', error)
        return NextResponse.json({
            message: 'Fehler beim Löschen des Bildes.',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
