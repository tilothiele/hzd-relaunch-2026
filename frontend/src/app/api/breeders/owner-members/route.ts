import { NextRequest, NextResponse } from 'next/server'
import { loadOwnerMembersByBreederDocumentIds } from '@/lib/server/breeder-owner-members'
import type { AuthUser } from '@/types'

export async function POST(request: NextRequest) {
	const token = process.env.STRAPI_API_TOKEN
	if (!token) {
		return NextResponse.json({ data: {} })
	}

	try {
		const body = await request.json() as { documentIds?: string[] }
		const documentIds = Array.isArray(body.documentIds)
			? [...new Set(body.documentIds.filter((documentId) => typeof documentId === 'string' && documentId.length > 0))]
			: []

		if (documentIds.length === 0) {
			return NextResponse.json({ data: {} })
		}

		const ownerMembersByDocumentId = await loadOwnerMembersByBreederDocumentIds(
			documentIds,
			token,
		)

		return NextResponse.json({
			data: ownerMembersByDocumentId as Record<string, AuthUser[]>,
		})
	} catch (error) {
		const message = error instanceof Error
			? error.message
			: 'Owner-Members konnten nicht geladen werden.'

		return NextResponse.json(
			{ error: { message } },
			{ status: 500 },
		)
	}
}
