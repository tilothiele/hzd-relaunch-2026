import { headers } from 'next/headers'

export async function getRequestClientIp(): Promise<string | null> {
	const h = await headers()
	const forwarded = h.get('x-forwarded-for')
	const realIp = h.get('x-real-ip')
	const cfConnectingIp = h.get('cf-connecting-ip')
	const ip = forwarded?.split(',')[0]?.trim()
		|| realIp
		|| cfConnectingIp
		|| null
	return ip && ip.length > 0 ? ip : null
}
