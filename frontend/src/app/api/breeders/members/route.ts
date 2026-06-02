import { NextRequest, NextResponse } from 'next/server'
import { fetchStrapiServer } from '@/lib/server/strapi-client'
import type { Breeder } from '@/types'

function sanitizePublicUser(user: Record<string, unknown> | null | undefined) {
	if (!user) {
		return null
	}

	if (user.publishMyData === true) {
		return user
	}

	return {
		id: user.id,
		documentId: user.documentId ?? null,
		cId: typeof user.cId === 'number' ? user.cId : null,
		username: `user-${user.id}`,
		email: `user-${user.id}@hovawarte.com`,
	}
}

export async function POST(request: NextRequest) {
	const token = process.env.STRAPI_API_TOKEN
	if (!token) {
		return NextResponse.json({ data: {} })
	}

	try {
		const body = await request.json() as { cIds?: number[] }
		const cIds = Array.isArray(body.cIds)
			? [...new Set(body.cIds.filter((cId) => typeof cId === 'number'))]
			: []

		if (cIds.length === 0) {
			return NextResponse.json({ data: {} })
		}

		const query = new URLSearchParams({
			'pagination[pageSize]': String(cIds.length),
			'fields[0]': 'documentId',
			'fields[1]': 'cId',
			'fields[2]': 'firstName',
			'fields[3]': 'lastName',
			'fields[4]': 'region',
			'fields[5]': 'phone',
			'fields[6]': 'email',
			'fields[7]': 'city',
			'fields[8]': 'address1',
			'fields[9]': 'address2',
			'fields[10]': 'zip',
			'fields[11]': 'countryCode',
			'fields[12]': 'locationLat',
			'fields[13]': 'locationLng',
			'fields[14]': 'DisplayName',
			'fields[15]': 'publishMyData',
		})

		cIds.forEach((cId, index) => {
			query.append(`filters[cId][$in][${index}]`, String(cId))
		})

		const response = await fetchStrapiServer<unknown>(
			`users?${query.toString()}`,
			undefined,
			{ token },
		)

		const users = Array.isArray(response)
			? response
			: Array.isArray((response as { data?: unknown[] })?.data)
				? (response as { data: Record<string, unknown>[] }).data
				: []

		const membersByCId: Record<number, NonNullable<Breeder['member']>> = {}

		for (const user of users) {
			const cId = typeof user.cId === 'number' ? user.cId : null
			if (cId == null) {
				continue
			}

			if (user.publishMyData === true) {
				const sanitized = sanitizePublicUser(user)
				if (sanitized) {
					membersByCId[cId] = sanitized as NonNullable<Breeder['member']>
				}
				continue
			}

			membersByCId[cId] = {
				documentId: String(user.documentId ?? ''),
				cId,
			}
		}

		return NextResponse.json({ data: membersByCId })
	} catch (error) {
		const message = error instanceof Error
			? error.message
			: 'Member konnten nicht geladen werden.'

		return NextResponse.json(
			{ error: { message } },
			{ status: 500 },
		)
	}
}
