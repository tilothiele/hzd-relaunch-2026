import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { fetchEntityList } from '@/lib/strapi/api'

const strapiToken = process.env.STRAPI_API_TOKEN

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateVapidKey = process.env.VAPID_PRIVATE_KEY

if (publicVapidKey && privateVapidKey) {
	webpush.setVapidDetails(
		'mailto:technik@hzd-hovawarte.de',
		publicVapidKey,
		privateVapidKey,
	)
}

export async function POST(request: NextRequest) {
	const timestamp = new Date().toISOString()

	if (!publicVapidKey || !privateVapidKey) {
		return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 500 })
	}

	try {
		const { message, channels } = await request.json()

		if (!message) {
			return NextResponse.json({ error: 'Message is required' }, { status: 400 })
		}

		const query = buildStrapiQuery({ pagination: { limit: -1 } })
		const subscriptions = await fetchEntityList<{
			documentId: string
			endpoint: string
			p256dh: string
			auth: string
			channels?: Record<string, boolean> | null
		}>('subscriptions', query, {
			server: true,
			token: strapiToken ?? null,
		})

		console.log(`[API Send][${timestamp}] Found ${subscriptions.length} total subscriptions.`)

		const targetChannels = Object.entries(channels || {})
			.filter(([_, enabled]) => enabled === true)
			.map(([key]) => key)

		const filteredSubscriptions = subscriptions.filter((sub) => {
			if (targetChannels.length === 0) return true
			const subChannels = sub.channels || {}
			return targetChannels.some((channel) => subChannels[channel] === true)
		})

		console.log(`[API Send][${timestamp}] Target channels:`, targetChannels)
		console.log(`[API Send][${timestamp}] Subscriptions matching channels: ${filteredSubscriptions.length}`)

		const notificationPayload = JSON.stringify({
			title: 'HZD Benachrichtigung',
			body: message,
			icon: '/icons/icon-192x192.png',
			badge: '/icons/badge-72x72.png',
			data: {
				url: '/notification-settings',
			},
		})

		const results = await Promise.allSettled(
			filteredSubscriptions.map(async (sub) => {
				const pushSubscription = {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth,
					},
				}

				try {
					await webpush.sendNotification(pushSubscription, notificationPayload)
					return { endpoint: sub.endpoint, success: true }
				} catch (error: unknown) {
					const pushError = error as { statusCode?: number; message?: string }
					console.error(`[API Send] Error sending to ${sub.endpoint}:`, pushError.statusCode, pushError.message)
					return {
						endpoint: sub.endpoint,
						success: false,
						error: pushError.message,
						statusCode: pushError.statusCode,
					}
				}
			}),
		)

		const summary = {
			total: filteredSubscriptions.length,
			success: results.filter((r) => r.status === 'fulfilled' && r.value.success).length,
			failed: results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length,
		}

		console.log(`[API Send][${timestamp}] Summary:`, summary)

		return NextResponse.json({
			message: 'Notifications processed',
			summary,
			details: results,
		})

	} catch (error) {
		console.error(`[API Send][${timestamp}] Fatal error:`, error)
		return NextResponse.json({
			error: 'Failed to send notifications',
			details: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
