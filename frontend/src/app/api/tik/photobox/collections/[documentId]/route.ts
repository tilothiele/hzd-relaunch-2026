import { NextRequest, NextResponse } from 'next/server'
import { isTikDenied, requireTikUser } from '@/lib/server/tik-access'
import { deleteTikPhotoboxCollection } from '@/lib/server/tik-photobox'

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
			{ message: 'Ungültige Sammlungs-ID.' },
			{ status: 400 },
		)
	}

	try {
		const { warnings } = await deleteTikPhotoboxCollection(documentId)
		return NextResponse.json({
			message: 'Sammlung gelöscht.',
			warnings,
		})
	} catch (error) {
		const message = error instanceof Error
			? error.message
			: 'Sammlung konnte nicht gelöscht werden.'
		const status = message === 'Sammlung nicht gefunden.' ? 404 : 500
		if (status === 500) {
			console.error(
				'[TIK Photobox] Sammlung löschen fehlgeschlagen:',
				error,
			)
		}
		return NextResponse.json({
			message: status === 404
				? message
				: 'Sammlung konnte nicht gelöscht werden.',
		}, { status })
	}
}
