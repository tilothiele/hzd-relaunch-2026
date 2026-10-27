import { NextRequest, NextResponse } from 'next/server'
import { isTikDenied, requireTikUser } from '@/lib/server/tik-access'
import { deleteTikPhotoboxImage } from '@/lib/server/tik-photobox'

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

export async function DELETE(request: NextRequest, context: RouteContext) {
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
		const { warnings } = await deleteTikPhotoboxImage(documentId)
		return NextResponse.json({
			message: 'Bild gelöscht.',
			warnings,
		})
	} catch (error) {
		const message = error instanceof Error
			? error.message
			: 'Bild konnte nicht gelöscht werden.'
		const status = message === 'Bild nicht gefunden.' ? 404 : 500
		if (status === 500) {
			console.error('[TIK Photobox] Bild löschen fehlgeschlagen:', error)
		}
		return NextResponse.json({
			message: status === 404
				? message
				: 'Bild konnte nicht gelöscht werden.',
		}, { status })
	}
}
