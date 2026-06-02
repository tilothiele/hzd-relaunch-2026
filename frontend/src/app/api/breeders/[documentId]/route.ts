import { NextRequest, NextResponse } from 'next/server'
import { getBreederByDocumentId } from '@/lib/strapi/api'
import { loadOwnerMembersByBreederDocumentId } from '@/lib/server/breeder-owner-members'
import type { AuthUser, Breeder } from '@/types'

function mergeBreederWithOwnerMembers(
	breeder: Breeder,
	ownerMembers: AuthUser[],
): Breeder {
	if (ownerMembers.length === 0) {
		return breeder
	}

	return {
		...breeder,
		owner_members: ownerMembers,
		member: breeder.member ?? ownerMembers[0],
	}
}

type RouteContext = {
	params: Promise<{ documentId: string }>
}

export async function GET(
	_request: NextRequest,
	context: RouteContext,
) {
	const { documentId } = await context.params

	try {
		const token = process.env.STRAPI_API_TOKEN ?? null
		if (!token) {
			return NextResponse.json(
				{ error: { message: 'Server-Konfiguration unvollständig.' } },
				{ status: 500 },
			)
		}

		let breeder = await getBreederByDocumentId(documentId, {
			server: true,
			token,
			enriched: false,
		})

		if (!breeder) {
			return NextResponse.json(
				{ error: { message: 'Züchter nicht gefunden.' } },
				{ status: 404 },
			)
		}

		const ownerMembers = await loadOwnerMembersByBreederDocumentId(documentId, token)
		breeder = mergeBreederWithOwnerMembers(breeder, ownerMembers)

		return NextResponse.json({ data: breeder })
	} catch (error) {
		const message = error instanceof Error
			? error.message
			: 'Züchter konnten nicht geladen werden.'

		return NextResponse.json(
			{ error: { message } },
			{ status: 500 },
		)
	}
}
