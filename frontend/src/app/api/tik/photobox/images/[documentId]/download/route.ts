import { NextRequest, NextResponse } from 'next/server'
import { isTikDenied, requireTikUser } from '@/lib/server/tik-access'
import {
	contentDisposition,
	readTikPhotoboxOriginal,
} from '@/lib/server/tik-photobox'

export const dynamic = 'force-dynamic'

type RouteContext = {
	params: Promise<{ documentId: string }>
}

function parseDocumentId(value: string): string | null {
	const trimmed = value.trim()
	if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
		return null
	}
	return trimmed
}

export async function GET(request: NextRequest, context: RouteContext) {
	const access = await requireTikUser(request)
	if (isTikDenied(access)) {
		return access
	}

	const { documentId: rawId } = await context.params
	const documentId = parseDocumentId(rawId)
	if (!documentId) {
		return NextResponse.json(
			{ message: 'Ungültige Bild-ID.' },
			{ status: 400 },
		)
	}

	try {
		const file = await readTikPhotoboxOriginal(documentId)
		if (!file) {
			return NextResponse.json(
				{ message: 'Originalbild ist nicht vorhanden.' },
				{ status: 404 },
			)
		}

		return new NextResponse(new Uint8Array(file.buffer), {
			headers: {
				'Content-Type': file.contentType,
				'Content-Disposition': contentDisposition(file.fileName),
				'Content-Length': String(file.buffer.length),
				'Cache-Control': 'private, no-store',
			},
		})
	} catch (error) {
		console.error('[TIK Photobox] Download fehlgeschlagen:', error)
		const message = error instanceof Error
			? error.message
			: 'Originalbild konnte nicht geladen werden.'
		const status = message.includes('nicht konfiguriert') ? 503 : 500
		return NextResponse.json({
			message: status === 503
				? message
				: 'Originalbild konnte nicht geladen werden.',
		}, { status })
	}
}
