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

        if (!collectionId) {
            return NextResponse.json({ message: 'Keine Collection ID empfangen.' }, { status: 400 })
        }

        if (!token) {
            return NextResponse.json({ message: 'Nicht authentifiziert.' }, { status: 401 })
        }

        // 1. Get current user documentId via GraphQL
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

        // 2. Upload to S3
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Path: documentid(collection)/dateineme-des-bildes
        const s3Path = `${collectionId}/${image.name}`

        console.log(`[PhotoBox API] Uploading to S3: ${s3Path} (${buffer.length} bytes)`)

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Path,
            Body: buffer,
            ContentType: image.type,
        }))

        // 3. Create PhotoboxImage in Strapi
        console.log(`[PhotoBox API] Creating record in Strapi for user ${userDocumentId}`)

        await gqlClient.request(CREATE_PHOTOBOX_IMAGE, {
            data: {
                S3Path: s3Path, // Storing only the relative path (collectionId/filename)
                origin: userDocumentId,
                RenderedPersons: persons,
                ReneredDogs: dogs,
                UserMessage: message || '',
                photobox_image_collection: collectionId,
                publishedAt: new Date().toISOString()
            }
        })

        return NextResponse.json({
            message: 'Foto erfolgreich gespeichert.',
            details: {
                fileName: image.name,
                s3Path: s3Path,
                collectionId: collectionId
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
