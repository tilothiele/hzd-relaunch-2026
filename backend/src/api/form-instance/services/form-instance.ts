/**
 * form-instance service
 */

import { factories } from '@strapi/strapi';

type FormFieldComponent = {
    __component?: string
    EAName?: string | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STANDARD_FIELDS_MAP: Record<string, string> = {
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    street: 'Straße / Hausnummer',
    zip: 'PLZ',
    city: 'Ort',
    countryCode: 'Land',
    phone: 'Telefon',
    membershipNumber: 'Mitgliedsnummer',
    privacyPolicyAccepted: 'Datenschutz akzeptiert',
}

const STANDARD_FIELD_ORDER = [
    'membershipNumber',
    'firstName',
    'lastName',
    'email',
    'street',
    'zip',
    'city',
    'countryCode',
    'phone',
    'privacyPolicyAccepted',
]

function isEmail(value: unknown): value is string {
    return typeof value === 'string' && EMAIL_PATTERN.test(value.trim())
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function unwrapFormData(rawContent: unknown): Record<string, unknown> {
    if (!rawContent || typeof rawContent !== 'object') {
        return {}
    }

    const content = rawContent as { fields?: unknown }
    if (content.fields && typeof content.fields === 'object') {
        return content.fields as Record<string, unknown>
    }

    return rawContent as Record<string, unknown>
}

function extractSubmitterEmail(
    data: Record<string, unknown>,
    formFields: FormFieldComponent[] | undefined,
): string | null {
    const directCandidates = [data.email, data.EMail, data.Email]
    for (const candidate of directCandidates) {
        if (isEmail(candidate)) {
            return candidate.trim()
        }
    }

    for (const field of formFields ?? []) {
        if (field.__component !== 'form.email-adress' || !field.EAName) {
            continue
        }

        const value = data[field.EAName]
        if (isEmail(value)) {
            return value.trim()
        }
    }

    return null
}

function formatDisplayValue(value: unknown): string {
    if (typeof value === 'boolean') {
        return value ? 'Ja' : 'Nein'
    }

    if (value && typeof value === 'object') {
        return JSON.stringify(value)
    }

    return String(value ?? '')
}

function generateRows(
    entries: [string, unknown][],
    labelMap?: Record<string, string>,
): string {
    return entries.map(([key, value]) => {
        const label = escapeHtml(labelMap?.[key] || key)
        const displayValue = escapeHtml(formatDisplayValue(value))

        return `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; width: 40%; background-color: #f9f9f9;"><strong>${label}</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${displayValue}</td>
        </tr>`
    }).join('')
}

function extractThankYouHtml(thankYouMessage: unknown): string {
    if (!thankYouMessage) {
        return ''
    }

    if (Array.isArray(thankYouMessage)) {
        return thankYouMessage.map((block) => {
            if (block?.type === 'paragraph' && Array.isArray(block.children)) {
                const text = block.children.map((child: { text?: string }) => child.text ?? '').join('')
                return `<p>${escapeHtml(text)}</p>`
            }
            return ''
        }).join('')
    }

    return ''
}

function buildEmailHtml(options: {
    title: string
    introHtml?: string
    standardRows: string
    customRows: string
}): string {
    const { title, introHtml, standardRows, customRows } = options

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
          .content { padding: 20px 0; }
          .section-title { margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #555; }
          .fields-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
          .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${escapeHtml(title)}</h2>
          </div>
          <div class="content">
            ${introHtml ?? ''}
            ${introHtml ? '<hr />' : ''}

            ${standardRows ? `
            <h3 class="section-title">Persönliche Daten</h3>
            <table class="fields-table">
              <tbody>
                  ${standardRows}
              </tbody>
            </table>
            ` : ''}

            ${customRows ? `
            <h3 class="section-title">Formulardaten</h3>
            <table class="fields-table">
              <tbody>
                  ${customRows}
              </tbody>
            </table>
            ` : ''}

          </div>
          <div class="footer">
            <p>Dies ist eine automatisch generierte Nachricht.</p>
          </div>
        </div>
      </body>
      </html>
    `
}

export default factories.createCoreService('api::form-instance.form-instance', ({ strapi }) => ({
    async sendConfirmationEmail(documentId: string) {
        const formInstance = await strapi.documents('api::form-instance.form-instance').findOne({
            documentId,
            populate: {
                form: {
                    populate: ['FormFields'],
                },
            },
        })

        if (!formInstance || !formInstance.form || !formInstance.Content) {
            strapi.log.warn(`No form or content found for form-instance ${documentId} when attempting to send email.`)
            return
        }

        const form = formInstance.form as typeof formInstance.form & {
            SendConfirmationMail?: boolean | null
            SuccessEMail?: string | null
            FormFields?: FormFieldComponent[]
            ThankYouMessage?: unknown
            Name?: string | null
        }

        const sendConfirmationMail = form.SendConfirmationMail === true
        const successEmail = typeof form.SuccessEMail === 'string'
            ? form.SuccessEMail.trim()
            : ''

        if (!sendConfirmationMail && !successEmail) {
            strapi.log.info(`No form emails configured for form-instance ${documentId}. Skipping.`)
            return
        }

        const data = unwrapFormData(formInstance.Content)
        const formName = form.Name || 'Formular'

        const customData: Record<string, unknown> = {}
        Object.entries(data).forEach(([key, value]) => {
            if (!STANDARD_FIELDS_MAP[key] && key !== 'formId' && key !== 'formName') {
                customData[key] = value
            }
        })

        const standardDataEntries: [string, unknown][] = []
        STANDARD_FIELD_ORDER.forEach((key) => {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                standardDataEntries.push([key, data[key]])
            }
        })

        const standardRows = generateRows(standardDataEntries, STANDARD_FIELDS_MAP)
        const customRows = generateRows(Object.entries(customData))

        const sendMail = async (to: string, subject: string, html: string) => {
            strapi.log.info(`Sending form email for ${documentId} to ${to} (${subject})`)
            await strapi.plugin('email').service('email').send({
                to,
                subject,
                html,
            })
        }

        if (sendConfirmationMail) {
            const recipientEmail = extractSubmitterEmail(data, form.FormFields)
            if (!recipientEmail) {
                strapi.log.info(`No recipient email found for form-instance ${documentId}. Skipping confirmation mail.`)
            } else {
                await sendMail(
                    recipientEmail,
                    `Bestätigung: ${formName}`,
                    buildEmailHtml({
                        title: `Bestätigung: ${formName}`,
                        introHtml: extractThankYouHtml(form.ThankYouMessage),
                        standardRows,
                        customRows,
                    }),
                )
            }
        }

        if (successEmail) {
            await sendMail(
                successEmail,
                `Neue Einsendung: ${formName}`,
                buildEmailHtml({
                    title: `Neue Einsendung: ${formName}`,
                    standardRows,
                    customRows,
                }),
            )
        }
    },
}))
