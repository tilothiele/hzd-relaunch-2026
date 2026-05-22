import { NextRequest, NextResponse } from 'next/server'

const strapiBaseUrl =
	process.env.STRAPI_BASE_URL
	|| process.env.NEXT_PUBLIC_STRAPI_BASE_URL
	|| 'http://localhost:1337'

/**
 * Proxy-Route für Strapi Forgot Password.
 * Umgeht CORS-Probleme, indem die Anfrage serverseitig weitergeleitet wird.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		const response = await fetch(`${strapiBaseUrl}/api/auth/forgot-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		const data = await response.json()

		if (!response.ok) {
			return NextResponse.json(
				{
					error: data.error || {
						message: 'E-Mail konnte nicht gesendet werden',
					},
				},
				{ status: response.status },
			)
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('Forgot password proxy error:', error)
		return NextResponse.json(
			{
				error: {
					message:
						'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
				},
			},
			{ status: 500 },
		)
	}
}
