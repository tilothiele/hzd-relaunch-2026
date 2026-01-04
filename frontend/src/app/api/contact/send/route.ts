import { NextResponse } from 'next/server'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { from, to, subject, message } = body
        const subjectLimit = parseInt(process.env.NEXT_PUBLIC_CONTACT_FORM_SUBJECT_MAX_LENGTH || '200')
        const messageLimit = parseInt(process.env.NEXT_PUBLIC_CONTACT_FORM_MESSAGE_MAX_LENGTH || '2000')

        // Validation
        if (!from || !to || !subject || !message) {
            return NextResponse.json(
                { message: 'Alle Pflichtfelder müssen ausgefüllt sein.' },
                { status: 400 }
            )
        }

        if (subject.length > subjectLimit) {
            return NextResponse.json(
                { message: `Der Betreff darf maximal ${subjectLimit} Zeichen lang sein.` },
                { status: 400 }
            )
        }

        if (message.length > messageLimit) {
            return NextResponse.json(
                { message: `Die Nachricht darf maximal ${messageLimit} Zeichen lang sein.` },
                { status: 400 }
            )
        }

        // Forward to Strapi sendmail API
        // We assuming the endpoint is /api/hzd-plugin/send-mail as per user request context
        const strapiResponse = await fetch(`${strapiBaseUrl}/api/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if needed, but for contact form it's usually public or has a separate logic
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                text: message, // Strapi often expects 'text' or 'html'
            }),
        })

        if (!strapiResponse.ok) {
            const errorData = await strapiResponse.json().catch(() => ({}))
            console.error('Strapi sendmail error:', errorData)
            return NextResponse.json(
                { message: errorData.error?.message || 'Fehler beim Senden der Email über das Backend.' },
                { status: strapiResponse.status }
            )
        }

        return NextResponse.json(
            { message: 'Die Nachricht wurde erfolgreich versendet.' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in contact mailer API:', error)
        return NextResponse.json(
            { message: 'Interner Serverfehler beim Verarbeiten der Nachricht.' },
            { status: 500 }
        )
    }
}
