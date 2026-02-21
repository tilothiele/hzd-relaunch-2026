import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

// S3 Configuration (same as in upload route)
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const rawPath = searchParams.get('path')

        if (!rawPath) {
            return NextResponse.json({ message: 'Pfad fehlt.' }, { status: 400 })
        }

        // Sanitize path: If it's a full URL, extract the relative key
        let s3Key = rawPath;
        if (rawPath.startsWith('http')) {
            try {
                const url = new URL(rawPath);
                s3Key = url.pathname;
            } catch (e) {
                console.error('[PhotoBox Image Proxy] Failed to parse URL:', rawPath);
            }
        }

        // 1. Decode URL encoding (e.g., %20 -> space)
        s3Key = decodeURIComponent(s3Key);

        // 2. Remove leading slash
        if (s3Key.startsWith('/')) {
            s3Key = s3Key.substring(1);
        }

        // 3. Remove bucket name if it's the first part of the path
        if (bucketName && s3Key.startsWith(bucketName + '/')) {
            s3Key = s3Key.substring(bucketName.length + 1);
        }

        console.log(`[PhotoBox Image Proxy] Fetching Key: "${s3Key}" (Original: "${rawPath}")`)

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        })

        const response = await s3Client.send(command)

        if (!response.Body) {
            console.error(`[PhotoBox Image Proxy] Empty body for key: ${s3Key}`)
            return NextResponse.json({ message: 'Bildinhalt leer.' }, { status: 404 })
        }

        const arrayBuffer = await response.Body.transformToByteArray()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`[PhotoBox Image Proxy] Success: ${s3Key} (${buffer.length} bytes)`)

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.ContentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })

    } catch (error) {
        console.error('[PhotoBox Image Proxy] Error:', error)
        return NextResponse.json({
            message: 'Fehler beim Laden des Bildes.',
            error: error instanceof Error ? error.message : String(error),
            details: error instanceof Error ? (error as any).code : undefined
        }, { status: 500 })
    }
}
