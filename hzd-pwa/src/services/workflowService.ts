import { serverLog } from '../lib/server-only';
import type { FormData } from '../types/formData';
import { getEmailService } from './emailService';
import { getPdfService } from './pdfService';

const PDF_RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * WorkflowService - Verwaltet Workflows für Mitgliedschaften
 */
class WorkflowService {

  /**
   * Verarbeitet ein neues Mitglied nach der Antragsstellung
   *
   * @param formData - Die Formulardaten aus dem Antragsformular
   * @returns Promise<boolean> - true bei Erfolg, false bei Fehler
   */
  async neuesMitglied(formData: FormData): Promise<boolean> {
    try {
      const workflowEndpoint = process.env.WORKFLOW_ENDPOINT_URL?.trim();
      const pdfRecipient = process.env.APPLICATION_PDF_EMAIL?.trim();

      if (!workflowEndpoint && !pdfRecipient) {
        console.log(
          'WORKFLOW_ENDPOINT_URL und APPLICATION_PDF_EMAIL nicht gesetzt, Weiterleitung wird übersprungen'
        );
        return true;
      }

      // erzeuge das PDF
      const pdfService = getPdfService();
      const pdf = await pdfService.createPdf(formData);
      if(!pdf) {
        serverLog(`Fehler beim Erzeugen des PDFs für: ${formData.email}`);
        return false;
      }

      serverLog(`Workflow "Neues Mitglied" gestartet für: ${formData.email}`);

      if (!workflowEndpoint) {
        console.log(
          'WORKFLOW_ENDPOINT_URL nicht gesetzt, Workflow-API-Aufruf wird übersprungen'
        );
        await this.sendPdfToRecipient(formData, pdf, pdfRecipient);
        return true;
      }

        serverLog(`Sende Daten an Workflow-Endpoint: ${workflowEndpoint}`);

        try {
          // Konvertiere PDF zu Base64
          const pdfBase64 = Buffer.from(pdf).toString('base64');

          // Erstelle JSON-Payload
          const payload = {
            formData: formData,
            pdf: pdfBase64
          };

          // Bereite Headers vor
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };

          // Optional: BASIC Auth
          const workflowUser = process.env.WORKFLOW_ENDPOINT_USER;
          const workflowPassword = process.env.WORKFLOW_ENDPOINT_PASSWORD;

          if (workflowUser && workflowPassword) {
            const credentials = Buffer.from(`${workflowUser}:${workflowPassword}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
            serverLog('BASIC Auth aktiviert für Workflow-Endpoint');
          }

          // Sende POST-Request
          const fetchOptions: RequestInit = {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          }

          // Node.js spezifisch: SSL-Validierung deaktivieren
          if (process.env.WORKFLOW_IGNORE_SSL === 'true') {
            serverLog('WARNUNG: SSL-Validierung deaktiviert für Workflow-Endpoint');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          }

          const response = await fetch(workflowEndpoint, fetchOptions);

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
          }

//          const responseData = await response.text();
//          serverLog(`Workflow-Endpoint erfolgreich aufgerufen. Response: ${responseData}`);

          serverLog(`Workflow-Endpoint erfolgreich aufgerufen.`);
          await this.sendPdfToRecipient(formData, pdf, pdfRecipient);

        } catch (endpointError) {
          console.error('Fehler beim Aufruf des Workflow-Endpoints:', endpointError);
          serverLog(`Fehler beim Workflow-Endpoint-Aufruf: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
        return false;
      }

      serverLog(`Workflow "Neues Mitglied" abgeschlossen für: ${formData.email}`);
      return true;

    } catch (error) {
      console.error('Fehler im Workflow "Neues Mitglied":', error);
      serverLog(`Fehler im Workflow "Neues Mitglied" für ${formData.email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Sendet das Antrags-PDF, wenn APPLICATION_PDF_EMAIL eine Adresse enthält.
   * Ein Fehler beim Versand bricht den Workflow nicht ab.
   */
  private async sendPdfToRecipient(
    formData: FormData,
    pdf: ArrayBuffer,
    pdfRecipient: string | undefined
  ): Promise<void> {
    if (!pdfRecipient) {
      return;
    }

    if (!PDF_RECIPIENT_PATTERN.test(pdfRecipient)) {
      serverLog(
        'APPLICATION_PDF_EMAIL ist keine gültige E-Mail-Adresse, Versand wird übersprungen'
      );
      return;
    }

    if (!process.env.SMTP_HOST) {
      serverLog(
        'SMTP_HOST nicht gesetzt, Versand des Antrags-PDFs wird übersprungen'
      );
      return;
    }

    const emailService = getEmailService();
    const emailSent = await emailService.sendApplicationPdf(
      pdfRecipient,
      formData,
      pdf
    );

    if (!emailSent) {
      serverLog(`Antrags-PDF konnte nicht an ${pdfRecipient} gesendet werden`);
    }
  }
}

// Singleton-Instanz
let workflowService: WorkflowService | null = null;

export function getWorkflowService(): WorkflowService {
  if (!workflowService) {
    workflowService = new WorkflowService();
  }
  return workflowService;
}

