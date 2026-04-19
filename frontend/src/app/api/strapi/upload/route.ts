import { NextRequest, NextResponse } from 'next/server'

const strapiBaseUrl =
	process.env.STRAPI_BASE_URL
	|| process.env.NEXT_PUBLIC_STRAPI_BASE_URL
	|| 'http://localhost:1337'

export const dynamic = 'force-dynamic'

/**
 * Proxied Strapi-Medien-Upload (vermeidet CORS: Browser spricht nur same-origin).
 * JWT kommt per Form-Feld `token` (wie PhotoBox), nicht im Authorization-Header —
 * sonst würde der Browser die Basic-Auth gegen den Reverse-Proxy verlieren.
 */
export async function POST(request: NextRequest) {
	let formData: FormData
	try {
		formData = await request.formData()
	} catch {
		return NextResponse.json(
			{ message: 'Ungültige Formulardaten.' },
			{ status: 400 },
		)
	}

	const tokenField = formData.get('token')
	const jwtFromForm =
		typeof tokenField === 'string' && tokenField.length > 0
			? tokenField
			: null
	const authHeader = request.headers.get('authorization')
	const jwtFromBearer =
		authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
	const jwt = jwtFromForm ?? jwtFromBearer

	if (!jwt) {
		return NextResponse.json(
			{ message: 'Nicht authentifiziert.' },
			{ status: 401 },
		)
	}

	const upstream = new FormData()
	for (const [key, value] of formData.entries()) {
		if (key === 'token') {
			continue
		}
		upstream.append(key, value)
	}

	const upstreamRes = await fetch(
		`${strapiBaseUrl.replace(/\/$/, '')}/api/upload`,
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${jwt}` },
			body: upstream,
		},
	)

	const text = await upstreamRes.text()
	const contentType =
		upstreamRes.headers.get('Content-Type') || 'application/json'

	return new NextResponse(text, {
		status: upstreamRes.status,
		headers: { 'Content-Type': contentType },
	})
}
