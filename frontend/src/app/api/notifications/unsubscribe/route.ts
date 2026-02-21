import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import { DELETE_SUBSCRIPTION } from '@/lib/graphql/mutations'
import { GET_SUBSCRIPTION_BY_ENDPOINT } from '@/lib/graphql/queries'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

export async function POST(request: NextRequest) {
    const timestamp = new Date().toISOString();
    try {
        const { endpoint } = await request.json()
        console.log(`[API Unsubscribe][${timestamp}] Incoming endpoint:`, endpoint);

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
        }

        const strapiUrl = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`;
        console.log(`[API Unsubscribe][${timestamp}] Using Strapi URL: ${strapiUrl}`);
        const client = new GraphQLClient(strapiUrl)

        const token = process.env.STRAPI_API_TOKEN;
        if (token) {
            console.log(`[API Unsubscribe][${timestamp}] Using STRAPI_API_TOKEN for authentication`);
            client.setHeader('Authorization', `Bearer ${token}`);
        } else {
            console.warn(`[API Unsubscribe][${timestamp}] WARNING: No STRAPI_API_TOKEN found in environment`);
        }

        // Find the subscription by endpoint first to get the documentId
        console.log(`[API Unsubscribe][${timestamp}] Searching for subscription by endpoint...`);
        const findData = await client.request<any>(GET_SUBSCRIPTION_BY_ENDPOINT, { endpoint })
        console.log(`[API Unsubscribe][${timestamp}] Search result:`, JSON.stringify(findData, null, 2));

        const subscription = findData.subscriptions?.[0]

        if (!subscription) {
            console.log('[API Unsubscribe] No subscription found for endpoint.');
            return NextResponse.json({ message: 'Subscription not found' }, { status: 200 })
        }

        console.log(`[API Unsubscribe][${timestamp}] Deleting subscription:`, subscription.documentId);
        const data = await client.request(DELETE_SUBSCRIPTION, {
            documentId: subscription.documentId
        })
        console.log(`[API Unsubscribe][${timestamp}] Delete response:`, JSON.stringify(data, null, 2));

        return NextResponse.json(data)
    } catch (error) {
        console.error('Unsubscription error:', error)
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }
}
