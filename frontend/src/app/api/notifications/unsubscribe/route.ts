import { NextRequest, NextResponse } from 'next/server'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { deleteEntity, fetchEntityList } from '@/lib/strapi/api'

const strapiToken = process.env.STRAPI_API_TOKEN

function getApiOptions() {
	return {
		server: true as const,
		baseUrl: getStrapiPublicBaseUrl(),
		token: strapiToken ?? null,
	}
}

export async function POST(request: NextRequest) {
	const timestamp = new Date().toISOString()
	try {
		const { endpoint } = await request.json()
		console.log(`[API Unsubscribe][${timestamp}] Incoming endpoint:`, endpoint)

		if (!endpoint) {
			return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
		}

		if (!strapiToken) {
			console.warn(`[API Unsubscribe][${timestamp}] WARNING: No STRAPI_API_TOKEN found in environment`)
		}

		const query = buildStrapiQuery({
			filters: { endpoint: { eq: endpoint } },
			pagination: { pageSize: 1 },
		})
		const subscriptions = await fetchEntityList<{ documentId: string }>(
			'subscriptions',
			query,
			getApiOptions(),
		)
		const subscription = subscriptions[0]

		if (!subscription) {
			console.log('[API Unsubscribe] No subscription found for endpoint.')
			return NextResponse.json({ message: 'Subscription not found' }, { status: 200 })
		}

		console.log(`[API Unsubscribe][${timestamp}] Deleting subscription:`, subscription.documentId)
		await deleteEntity('subscriptions', subscription.documentId, getApiOptions())

		return NextResponse.json({ message: 'Subscription deleted' })
	} catch (error) {
		console.error('Unsubscription error:', error)
		return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
	}
}
