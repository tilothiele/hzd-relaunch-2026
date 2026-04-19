import { NextRequest, NextResponse } from 'next/server'

const strapiBaseUrl =
	process.env.STRAPI_BASE_URL
	|| process.env.NEXT_PUBLIC_STRAPI_BASE_URL
	|| 'http://localhost:1337'

export const dynamic = 'force-dynamic'

/**
 * Proxied Strapi-Medien-Upload (vermeidet CORS: Browser spricht nur same-origin).
 */
export async function POST(request: NextRequest) {
	const auth = request.headers.get('authorization')
	if (!auth?.startsWith('Bearer ')) {
		return NextResponse.json(
			{ message: 'Nicht authentifiziert.' },
			{ status: 401 },
		)
	}

	let formData: FormData
	try {
		formData = await request.formData()
	} catch {
		return NextResponse.json(
			{ message: 'Ungültige Formulardaten.' },
			{ status: 400 },
		)
	}

	const upstream = await fetch(
		`${strapiBaseUrl.replace(/\/$/, '')}/api/upload`,
		{
			method: 'POST',
			headers: { Authorization: auth },
			body: formData,
		},
	)

	const text = await upstream.text()
	const contentType =
		upstream.headers.get('Content-Type') || 'application/json'

	return new NextResponse(text, {
		status: upstream.status,
		headers: { 'Content-Type': contentType },
	})
}
