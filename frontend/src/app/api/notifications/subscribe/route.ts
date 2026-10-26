import { NextRequest, NextResponse } from 'next/server'
import {
	findPushSubscriptionsByEndpoint,
	readChannels,
	savePushSubscription,
} from '@/lib/server/push-subscriptions'

const strapiToken = process.env.STRAPI_API_TOKEN

function getApiOptions() {
	return {
		server: true as const,
		token: strapiToken ?? null,
	}
}

export async function GET(request: NextRequest) {
	const timestamp = new Date().toISOString()
	try {
		const { searchParams } = new URL(request.url)
		const endpoint = searchParams.get('endpoint')

		if (!endpoint) {
			return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
		}

		const subscriptions = await findPushSubscriptionsByEndpoint(endpoint, getApiOptions())
		const subscription = subscriptions[0] ?? null

		return NextResponse.json({
			subscriptions: subscription
				? [{ ...subscription, channels: readChannels(subscription.channels) }]
				: [],
		})
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

		const existing = (await findPushSubscriptionsByEndpoint(subscription.endpoint, getApiOptions()))[0] ?? null
		const p256dh = subscription.keys?.p256dh || subscription.p256dh || existing?.p256dh || ''
		const auth = subscription.keys?.auth || subscription.auth || existing?.auth || ''

		if (!p256dh || !auth) {
			return NextResponse.json({
				error: 'Push-Schlüssel fehlen. Bitte Benachrichtigungen neu aktivieren.',
			}, { status: 400 })
		}

		const channels = subscription.channels
			? readChannels(subscription.channels)
			: readChannels(existing?.channels)

		const result = await savePushSubscription({
			endpoint: subscription.endpoint,
			p256dh,
			auth,
			channels,
		}, existing, getApiOptions())

		return NextResponse.json(result)
	} catch (error) {
		console.error(`[API Subscribe][${timestamp}] Subscription error:`, error)
		return NextResponse.json({
			error: 'Failed to subscribe/update',
			details: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
