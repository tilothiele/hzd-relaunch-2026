import { NextRequest, NextResponse } from 'next/server'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'
const tikEmail = process.env.TIK_EMAIL || 'tik-service@hzd-hovawarte.de'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const image = formData.get('image') as File
        const persons = formData.get('persons') as string
        const dogs = formData.get('dogs') as string

        if (!image) {
            return NextResponse.json({ message: 'Kein Bild empfangen.' }, { status: 400 })
        }

        console.log(`[PhotoBox API] Received upload: ${image.name} (${image.size} bytes)`)
        console.log(`[PhotoBox API] Persons: ${persons || 'n/a'}`)
        console.log(`[PhotoBox API] Dogs: ${dogs || 'n/a'}`)

        // Logic for forwarding to Strapi or Email
        // Since we don't have a direct PhotoBox content type in Strapi yet, 
        // we use the email API to notify TIK.

        // Note: For a real file attachment, Strapi Email API needs careful configuration.
        // For now, we simulate the success and log the data.

        /* 
        const strapiEmailResponse = await fetch(`${strapiBaseUrl}/api/email`, {
            method: 'POST',
            body: JSON.stringify({
                to: tikEmail,
                subject: 'Neues Foto aus der HZD PhotoBox',
                text: `Ein neues Foto wurde hochgeladen.\n\nPersonen: ${persons || 'Keine Angabe'}\nHunde: ${dogs || 'Keine Angabe'}\n\nDatei: ${image.name}`,
                // Attachments would go here if supported by the email provider setup
            })
        })
        */

        // Placeholder for real upload logic (e.g. uploading to Strapi Media Library first)
        // const strapiMediaResponse = await fetch(...) 

        return NextResponse.json({
            message: 'Upload erfolgreich verarbeitet.',
            details: {
                fileName: image.name,
                persons: persons,
                dogs: dogs
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Error in PhotoBox upload API:', error)
        return NextResponse.json({
            message: 'Fehler beim Verarbeiten des Uploads.',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
