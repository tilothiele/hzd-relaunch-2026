import { NextRequest, NextResponse } from 'next/server'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { createEntity, fetchEntityList, updateEntity } from '@/lib/strapi/api'

const strapiToken = process.env.STRAPI_API_TOKEN

function getApiOptions() {
	return {
		server: true as const,
		token: strapiToken ?? null,
	}
}

async function findSubscriptionByEndpoint(endpoint: string) {
	const query = buildStrapiQuery({
		filters: { endpoint: { eq: endpoint } },
		pagination: { pageSize: 1 },
	})
	const subscriptions = await fetchEntityList<{
		documentId: string
		endpoint: string
		p256dh?: string
		auth?: string
		channels?: Record<string, boolean> | null
	}>('subscriptions', query, getApiOptions())
	return subscriptions[0] ?? null
}

export async function GET(request: NextRequest) {
	const timestamp = new Date().toISOString()
	try {
		const { searchParams } = new URL(request.url)
		const endpoint = searchParams.get('endpoint')

		if (!endpoint) {
			return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
		}

		const subscription = await findSubscriptionByEndpoint(endpoint)

		return NextResponse.json({ subscriptions: subscription ? [subscription] : [] })
	} catch (error) {
		console.error(`[API Subscribe][GET][${timestamp}] Fetch error:`, error)
		return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	const timestamp = new Date().toISOString()
	try {
		const subscription = await request.json()

		if (!subscription || !subscription.endpoint) {
			console.error(`[API Subscribe][${timestamp}] Error: Invalid subscription data`)
			return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
		}

		const existingSub = await findSubscriptionByEndpoint(subscription.endpoint)

		const variableData = {
			endpoint: subscription.endpoint,
			p256dh: subscription.keys?.p256dh || subscription.p256dh || existingSub?.p256dh || '',
			auth: subscription.keys?.auth || subscription.auth || existingSub?.auth || '',
			channels: subscription.channels || existingSub?.channels || null,
			publishedAt: new Date().toISOString(),
		}

		let result
		if (existingSub) {
			result = await updateEntity(
				'subscriptions',
				existingSub.documentId,
				variableData,
				getApiOptions(),
			)
		} else {
			result = await createEntity('subscriptions', variableData, getApiOptions())
		}

		return NextResponse.json(result)
	} catch (error) {
		console.error(`[API Subscribe][${timestamp}] Subscription error:`, error)
		return NextResponse.json({
			error: 'Failed to subscribe/update',
			details: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
