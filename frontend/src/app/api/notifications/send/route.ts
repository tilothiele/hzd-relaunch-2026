import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { isTikDenied, requireTikUser } from '@/lib/server/tik-access'
import { listPushSubscriptions, readChannels } from '@/lib/server/push-subscriptions'

const strapiToken = process.env.STRAPI_API_TOKEN

function vapidKeys() {
	return {
		publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		privateKey: process.env.VAPID_PRIVATE_KEY,
	}
}

export async function POST(request: NextRequest) {
	const access = await requireTikUser(request)
	if (isTikDenied(access)) {
		return access
	}

	const timestamp = new Date().toISOString()
	const { publicKey, privateKey } = vapidKeys()

	if (!publicKey || !privateKey) {
		return NextResponse.json({ error: 'VAPID-Schlüssel fehlen auf dem Server' }, { status: 500 })
	}

	webpush.setVapidDetails(
		'mailto:technik@hzd-hovawarte.de',
		publicKey,
		privateKey,
	)

	try {

		const { message, channels } = await request.json()

		if (!message || typeof message !== 'string' || !message.trim()) {
			return NextResponse.json({ error: 'Message is required' }, { status: 400 })
		}

		const subscriptions = await listPushSubscriptions({
			server: true,
			token: strapiToken ?? null,
		})

		const targetChannels = Object.entries(channels || {})
			.filter(([, enabled]) => enabled === true)
			.map(([key]) => key)

		const filteredSubscriptions = subscriptions.filter((subscription) => {
			if (targetChannels.length === 0) return true
			const subscriptionChannels = readChannels(subscription.channels)
			if (Object.keys(subscriptionChannels).length === 0) return true
			return targetChannels.some((channel) => subscriptionChannels[channel] === true)
		})

		console.log(`[API Send][${timestamp}] Found ${subscriptions.length} subscriptions, ${filteredSubscriptions.length} match ${targetChannels.join(', ') || 'all channels'}.`)

		const notificationPayload = JSON.stringify({
			title: 'HZD Benachrichtigung',
			body: message,
			url: '/notification-settings',
			data: {
				url: '/notification-settings',
			},
		})

		const results = await Promise.allSettled(
			filteredSubscriptions.map(async (subscription) => {
				if (!subscription.p256dh || !subscription.auth) {
					return {
						endpoint: subscription.endpoint,
						success: false,
						error: 'Push-Schlüssel fehlen. Benachrichtigungen neu aktivieren.',
					}
				}

				const pushSubscription = {
					endpoint: subscription.endpoint,
					keys: {
						p256dh: subscription.p256dh,
						auth: subscription.auth,
					},
				}

				try {
					await webpush.sendNotification(pushSubscription, notificationPayload)
					return { endpoint: subscription.endpoint, success: true }
				} catch (error: unknown) {
					const pushError = error as { statusCode?: number; message?: string; body?: string }
					console.error(`[API Send] Error sending to ${subscription.endpoint}:`, pushError.statusCode, pushError.message, pushError.body)
					return {
						endpoint: subscription.endpoint,
						success: false,
						error: pushError.body || pushError.message,
						statusCode: pushError.statusCode,
					}
				}
			}),
		)

		const delivered = results.filter((result) => result.status === 'fulfilled' && result.value.success).length
		const failed = results.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)).length
		const summary = {
			total: subscriptions.length,
			matched: filteredSubscriptions.length,
			success: delivered,
			failed,
		}

		console.log(`[API Send][${timestamp}] Summary:`, summary)

		if (delivered === 0) {
			const firstFailure = results.find((result) => result.status === 'fulfilled' && !result.value.success)
			const failureText = firstFailure && firstFailure.status === 'fulfilled'
				? firstFailure.value.error
				: null
			const error = filteredSubscriptions.length === 0
				? `Kein Gerät passt zu den gewählten Kanälen (${targetChannels.join(', ') || 'alle'}). Gespeicherte Abonnements: ${subscriptions.length}.`
				: `Zustellung fehlgeschlagen${failureText ? `: ${failureText}` : ''}.`

			return NextResponse.json({ error, summary, details: results }, { status: 422 })
		}

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
