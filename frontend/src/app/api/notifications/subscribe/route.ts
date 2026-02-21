import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import { CREATE_SUBSCRIPTION, UPDATE_SUBSCRIPTION } from '@/lib/graphql/mutations'
import { GET_SUBSCRIPTION_BY_ENDPOINT } from '@/lib/graphql/queries'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

export async function GET(request: NextRequest) {
    const timestamp = new Date().toISOString();
    try {
        const { searchParams } = new URL(request.url)
        const endpoint = searchParams.get('endpoint')

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
        }

        const strapiUrl = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`;
        const client = new GraphQLClient(strapiUrl)

        const token = process.env.STRAPI_API_TOKEN;
        if (token) {
            client.setHeader('Authorization', `Bearer ${token}`);
        }

        console.log(`[API Subscribe][GET][${timestamp}] Checking for existing subscription: ${endpoint}`);
        const data = await client.request<any>(GET_SUBSCRIPTION_BY_ENDPOINT, { endpoint });

        return NextResponse.json(data)
    } catch (error) {
        console.error(`[API Subscribe][GET][${timestamp}] Fetch error:`, error)
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const timestamp = new Date().toISOString();
    try {
        const subscription = await request.json()

        console.log(`[API Subscribe][${timestamp}] Incoming subscription/update:`, JSON.stringify(subscription, null, 2));

        if (!subscription || !subscription.endpoint) {
            console.error(`[API Subscribe][${timestamp}] Error: Invalid subscription data`);
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
        }

        const strapiUrl = `${strapiBaseUrl.replace(/\/$/, '')}/graphql`;
        const client = new GraphQLClient(strapiUrl)

        const token = process.env.STRAPI_API_TOKEN;
        if (token) {
            client.setHeader('Authorization', `Bearer ${token}`);
        }

        // 1. Check if subscription already exists
        const findData = await client.request<any>(GET_SUBSCRIPTION_BY_ENDPOINT, { endpoint: subscription.endpoint });
        const existingSub = findData.subscriptions?.[0];

        const variableData = {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh || subscription.p256dh || existingSub?.p256dh || '',
            auth: subscription.keys?.auth || subscription.auth || existingSub?.auth || '',
            channels: subscription.channels || existingSub?.channels || null,
            publishedAt: new Date().toISOString()
        };

        let result;
        if (existingSub) {
            console.log(`[API Subscribe][${timestamp}] Updating existing subscription: ${existingSub.documentId}`);
            result = await client.request(UPDATE_SUBSCRIPTION, {
                documentId: existingSub.documentId,
                data: variableData
            });
        } else {
            console.log(`[API Subscribe][${timestamp}] Creating new subscription`);
            result = await client.request(CREATE_SUBSCRIPTION, {
                data: variableData
            });
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error(`[API Subscribe][${timestamp}] Subscription error:`, error)
        return NextResponse.json({
            error: 'Failed to subscribe/update',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
