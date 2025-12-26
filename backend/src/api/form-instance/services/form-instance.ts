/**
 * form-instance service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::form-instance.form-instance', ({ strapi }) => ({
    async sendConfirmationEmail(documentId: string) {
        // 1. Fetch the full entry with relations using Document Service
        const formInstance = await strapi.documents("api::form-instance.form-instance").findOne({
            documentId,
            populate: {
                form: {
                    populate: ["FormFields"],
                },
            },
        });

        if (!formInstance || !formInstance.form || !formInstance.Content) {
            strapi.log.warn(`No form or content found for form-instance ${documentId} when attempting to send email.`);
            return;
        }

        const form = formInstance.form;
        const rawContent = formInstance.Content as any;

        // User provided structure suggests data might be in a 'fields' property
        const data = rawContent.fields ? rawContent.fields : rawContent;

        // 2. Extract Recipient Email - checking casing from user example
        const recipientEmail = data.email || data.EMail || data.Email;

        if (!recipientEmail) {
            strapi.log.info(`No recipient email found for form-instance ${documentId}. Skipping email.`);
            return;
        }

        // 3. Prepare Data for Email
        const standardFieldsMap: Record<string, string> = {
            firstName: "Vorname",
            lastName: "Nachname",
            email: "E-Mail",
            street: "Straße / Hausnummer",
            zip: "PLZ",
            city: "Ort",
            countryCode: "Land", // Moved up for logical grouping, order in map doesn't strictly matter for lookup but good for ref
            phone: "Telefon",
            membershipNumber: "Mitgliedsnummer",
            privacyPolicyAccepted: "Datenschutz akzeptiert",
        };

        // Define explicit order for display
        const standardFieldOrder = [
            "membershipNumber",
            "firstName",
            "lastName",
            "email",
            "street",
            "zip",
            "city",
            "countryCode",
            "phone",
            "privacyPolicyAccepted"
        ];

        const standardDataEntries: [string, any][] = [];
        const customData: Record<string, any> = {};

        // 1. Collect Custom Data first
        Object.entries(data).forEach(([key, value]) => {
            if (!standardFieldsMap[key]) {
                if (key !== "formId" && key !== "formName") {
                    customData[key] = value;
                }
            }
        });

        // 2. Build Standard Data ordered list (only if present in data)
        standardFieldOrder.forEach(key => {
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
                standardDataEntries.push([key, data[key]]);
            }
        });

        // Helper to generate table rows
        const generateRows = (entries: [string, any][], labelMap?: Record<string, string>) => {
            return entries.map(([key, value]) => {
                const label = labelMap ? (labelMap[key] || key) : key;

                let displayValue = value;
                if (typeof value === 'boolean') {
                    displayValue = value ? 'Ja' : 'Nein';
                } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                }

                return `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; width: 40%; background-color: #f9f9f9;"><strong>${label}</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${displayValue}</td>
        </tr>`;
            }).join("");
        };

        const standardRows = generateRows(standardDataEntries, standardFieldsMap);
        const customRows = generateRows(Object.entries(customData));

        // 4. Generate HTML Email Body
        const formName = form.Name || "Formular";

        // Simple text extraction for blocks
        let thankYouHtml = "";
        if (form.ThankYouMessage) {
            if (Array.isArray(form.ThankYouMessage)) {
                thankYouHtml = form.ThankYouMessage.map(block => {
                    if (block.type === 'paragraph') {
                        return `<p>${block.children.map((c: any) => c.text).join('')}</p>`;
                    }
                    return '';
                }).join('');
            } else {
                thankYouHtml = `<div style="margin-bottom: 20px;">${JSON.stringify(form.ThankYouMessage)}</div>`;
            }
        }

        const emailHtml = `
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
            <h2>Bestätigung: ${formName}</h2>
          </div>
          <div class="content">
            ${thankYouHtml}
            <hr />
            
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
    `;

        strapi.log.info(`Sending Confirmation email for form-instance ${documentId} to ${recipientEmail} \n\n${emailHtml}`);

        // 5. Send Email
        await strapi.plugin("email").service("email").send({
            to: recipientEmail,
            subject: `Bestätigung: ${formName}`,
            html: emailHtml,
        });

    }
}));
