import { NextRequest, NextResponse } from 'next/server'
import {
	deletePushSubscriptions,
	findPushSubscriptionsByEndpoint,
} from '@/lib/server/push-subscriptions'

const strapiToken = process.env.STRAPI_API_TOKEN

function getApiOptions() {
	return {
		server: true as const,
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

		const subscriptions = await findPushSubscriptionsByEndpoint(endpoint, getApiOptions())

		if (subscriptions.length === 0) {
			console.log('[API Unsubscribe] No subscription found for endpoint.')
			return NextResponse.json({ message: 'Subscription not found' }, { status: 200 })
		}

		console.log(`[API Unsubscribe][${timestamp}] Deleting subscriptions:`, subscriptions.map((subscription) => subscription.documentId))
		await deletePushSubscriptions(subscriptions, getApiOptions())

		return NextResponse.json({ message: 'Subscription deleted' })
	} catch (error) {
		console.error('Unsubscription error:', error)
		return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
	}
}
