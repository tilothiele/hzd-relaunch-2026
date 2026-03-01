import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { GraphQLClient } from 'graphql-request'
import { CREATE_PHOTOBOX_IMAGE } from '@/lib/graphql/mutations'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

// S3 Configuration
const s3Config = {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
        accessKeyId: process.env.S3_PHOTOBOX_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_PHOTOBOX_SECRET_KEY || '',
    },
    forcePathStyle: true, // Often needed for custom S3 endpoints like MinIO or R2
}

const s3Client = new S3Client(s3Config)
const bucketName = process.env.S3_PHOTOBOX_BUCKET || ''

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const image = formData.get('image') as File
        const persons = formData.get('persons') as string
        const dogs = formData.get('dogs') as string
        const message = formData.get('message') as string
        const collectionId = formData.get('collectionId') as string
        const token = formData.get('token') as string

        if (!image) {
            return NextResponse.json({ message: 'Kein Bild empfangen.' }, { status: 400 })
        }

        const maxSizeMB = Number(process.env.STRAPI_PUBLIC_MAX_PHOTO_SIZE_MB || 10)
        if (image.size > maxSizeMB * 1024 * 1024) {
            return NextResponse.json({ message: `Das Foto ist zu groß. Maximale Größe ist ${maxSizeMB}MB.` }, { status: 400 })
        }

        if (!collectionId) {
            return NextResponse.json({ message: 'Keine Collection ID empfangen.' }, { status: 400 })
        }

        if (!token) {
            return NextResponse.json({ message: 'Nicht authentifiziert.' }, { status: 401 })
        }

        // 1. Get current user documentId and username via GraphQL
        const gqlEndpoint = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`
        const gqlClient = new GraphQLClient(gqlEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const meResult = await gqlClient.request<{ me: { documentId: string, username: string, firstName?: string, lastName?: string } }>(`
            query { me { documentId username firstName lastName } }
        `)

        const { documentId: userDocumentId, firstName, lastName } = meResult.me
        const displayName = [firstName, lastName].filter(Boolean).join(' ') || meResult.me.username

        // 2. Upload to Strapi Media Library
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const strapiFormData = new FormData()
        const blob = new Blob([buffer], { type: image.type })
        strapiFormData.append('files', blob, image.name)

        // Add caption metadata
        const caption = `${displayName} - ${message || 'Keine Nachricht'} - ${persons || 'Keine Personen'} - ${dogs || 'Keine Hunde'}`
        strapiFormData.append('fileInfo', JSON.stringify({
            caption: caption,
            alternativeText: `Bilderspende von ${displayName}`
        }))

        console.log(`[PhotoBox API] Uploading to Strapi Media Library (root) with caption: ${caption}`)
        const strapiUploadRes = await fetch(`${strapiBaseUrl.replace(/\/$/, '')}/api/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: strapiFormData
        })

        let mediaId: string | number | null = null
        if (strapiUploadRes.ok) {
            try {
                const uploadData = await strapiUploadRes.json()
                if (Array.isArray(uploadData) && uploadData.length > 0) {
                    mediaId = uploadData[0].id
                    console.log(`[PhotoBox API] Strapi media uploaded successfully, ID: ${mediaId}`)
                }
            } catch (e) {
                console.error('[PhotoBox API] Failed to parse Strapi upload response:', e)
            }
        } else {
            const errorText = await strapiUploadRes.text()
            console.error('[PhotoBox API] Strapi media upload failed:', errorText)
        }

        // 4. Upload to S3
        // Path: documentid(collection)/dateineme-des-bildes
        const s3Path = `${collectionId}/${image.name}`

        console.log(`[PhotoBox API] Uploading to S3: ${s3Path} (${buffer.length} bytes)`)

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Path,
            Body: buffer,
            ContentType: image.type,
        }))

        // 5. Create PhotoboxImage in Strapi
        console.log(`[PhotoBox API] Creating record in Strapi for user ${userDocumentId}, Collection: ${collectionId}`)

        const mutationResponse = await gqlClient.request(CREATE_PHOTOBOX_IMAGE, {
            data: {
                S3Path: s3Path,
                origin: userDocumentId,
                RenderedPersons: persons,
                ReneredDogs: dogs,
                UserMessage: message || '',
                photobox_image_collection: collectionId,
                Thumbnail: mediaId,
                publishedAt: new Date().toISOString()
            }
        })

        console.log('[PhotoBox API] Mutation response:', JSON.stringify(mutationResponse, null, 2))

        return NextResponse.json({
            message: 'Foto erfolgreich gespeichert.',
            details: {
                fileName: image.name,
                s3Path: s3Path,
                collectionId: collectionId,
                mediaId: mediaId,
                record: (mutationResponse as any)?.createPhotoboxImage
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Error in PhotoBox upload API:', error)
        return NextResponse.json({
            message: 'Fehler beim Verarbeiten des Uploads.',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
