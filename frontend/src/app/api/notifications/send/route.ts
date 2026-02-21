import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import webpush from 'web-push'
import { GET_ALL_SUBSCRIPTIONS } from '@/lib/graphql/queries'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'
const strapiToken = process.env.STRAPI_API_TOKEN

// Initialize web-push with VAPID keys
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateVapidKey = process.env.VAPID_PRIVATE_KEY

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:technik@hzd-hovawarte.de',
        publicVapidKey,
        privateVapidKey
    )
}

export async function POST(request: NextRequest) {
    const timestamp = new Date().toISOString();

    if (!publicVapidKey || !privateVapidKey) {
        return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 500 })
    }

    try {
        const { message, channels } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // 1. Fetch all subscriptions from Strapi
        const strapiUrl = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`;
        const client = new GraphQLClient(strapiUrl)
        if (strapiToken) {
            client.setHeader('Authorization', `Bearer ${strapiToken}`);
        }

        console.log(`[API Send][${timestamp}] Fetching all subscriptions...`);
        const data = await client.request<any>(GET_ALL_SUBSCRIPTIONS);
        const subscriptions = data.subscriptions || [];

        console.log(`[API Send][${timestamp}] Found ${subscriptions.length} total subscriptions.`);

        // 2. Filter subscriptions by selected channels
        // If no channels are selected, we target everyone? Or nobody? 
        // Let's assume: if a list of requested channels is provided, the sub must have AT LEAST ONE of them enabled.
        const targetChannels = Object.entries(channels || {})
            .filter(([_, enabled]) => enabled === true)
            .map(([key]) => key);

        const filteredSubscriptions = subscriptions.filter((sub: any) => {
            if (targetChannels.length === 0) return true; // Send to all if no channels selected? 
            // Or better: only send if the user has subscribed to at least one of the target channels
            const subChannels = sub.channels || {};
            return targetChannels.some(channel => subChannels[channel] === true);
        });

        console.log(`[API Send][${timestamp}] Target channels:`, targetChannels);
        console.log(`[API Send][${timestamp}] Subscriptions matching channels: ${filteredSubscriptions.length}`);

        // 3. Send notifications
        const notificationPayload = JSON.stringify({
            title: 'HZD Benachrichtigung',
            body: message,
            icon: '/icons/icon-192x192.png', // Default icon path
            badge: '/icons/badge-72x72.png',
            data: {
                url: '/notification-settings' // Default link
            }
        });

        const results = await Promise.allSettled(
            filteredSubscriptions.map(async (sub: any) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                try {
                    await webpush.sendNotification(pushSubscription, notificationPayload);
                    return { endpoint: sub.endpoint, success: true };
                } catch (error: any) {
                    console.error(`[API Send] Error sending to ${sub.endpoint}:`, error.statusCode, error.message);
                    // If 410 Gone or 404 Not Found, we should probably delete the subscription from Strapi
                    // But for now we just log it
                    return { endpoint: sub.endpoint, success: false, error: error.message, statusCode: error.statusCode };
                }
            })
        );

        const summary = {
            total: filteredSubscriptions.length,
            success: results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length,
            failed: results.filter((r: any) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
        };

        console.log(`[API Send][${timestamp}] Summary:`, summary);

        return NextResponse.json({
            message: 'Notifications processed',
            summary,
            details: results
        });

    } catch (error) {
        console.error(`[API Send][${timestamp}] Fatal error:`, error)
        return NextResponse.json({
            error: 'Failed to send notifications',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
