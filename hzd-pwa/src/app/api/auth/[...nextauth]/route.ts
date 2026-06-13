import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import type { NextRequest } from 'next/server'

const nextAuthHandler = NextAuth(authOptions)

type RouteContext = {
	params: Promise<{ nextauth: string[] }>
}

async function handleAuthRequest(
	req: NextRequest,
	context: RouteContext,
) {
	return nextAuthHandler(req, context)
}

export async function GET(req: NextRequest, context: RouteContext) {
	return handleAuthRequest(req, context)
}

export async function POST(req: NextRequest, context: RouteContext) {
	return handleAuthRequest(req, context)
}
