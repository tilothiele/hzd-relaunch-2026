import { generateServerUuid, serverLog } from '../lib/server-only';
import { DatabaseService } from '../lib/database-prisma';
import { FormData } from '../types/formData';
import { ApplicationSubmissionRequest, ApplicationSubmissionResponse } from '../types/api';
import { getEmailService } from './emailService';
import { getWorkflowService } from './workflowService';

class ApplicationService {
  private db = new DatabaseService();

  /**
   * Speichert eine neue Antragsanmeldung in der Datenbank
   */
  async submitApplication(request: ApplicationSubmissionRequest): Promise<ApplicationSubmissionResponse> {
    console.log(process.env.DATABASE_URL);
    try {
      const { formData, uuid } = request;

      // Datenbank initialisieren
      await this.db.initializeDatabase();

      // Validierung der Formulardaten
      const validationResult = this.validateFormData(formData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Validierungsfehler',
          errors: validationResult.errors
        };
      }

      if (!uuid || !uuid.trim()) {
        return {
          success: false,
          message: 'UUID ist erforderlich'
        };
      }

      // Prüfe ob bereits eine Anwendung mit dieser E-Mail existiert
      const noDdosCheck = process.env.DISABLE_DDOS_CHECK === 'true';
      const existingApplication = await this.db.getApplicationByEmail(formData.email);
      if (existingApplication && !noDdosCheck) {
        try {
          // Verwende die bestehende UUID der Anmeldung als Verification Token
          const existingUuid = existingApplication.uuid;

          if (!existingUuid) {
            return {
              success: false,
              message: 'Eine Anmeldung mit dieser E-Mail-Adresse existiert bereits'
            };
          }

          // Aktualisiere den Zeitstempel für die gesendete Verifizierung
          await this.db.updateVerificationSentAt(formData.email);

          // Sende E-Mail mit Verification Link (verwendet die bestehende UUID)
          const emailService = getEmailService();
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const emailSent = await emailService.sendVerificationEmail(
            formData.email,
            existingUuid,
            baseUrl
          );

          if (!emailSent) {
            serverLog(`Fehler beim Senden der Verifizierungs-E-Mail an ${formData.email}`);
          } else {
            serverLog(`Verifizierungs-E-Mail gesendet an ${formData.email}`);
          }

          return {
            success: false,
            message: 'Eine Anmeldung mit dieser E-Mail-Adresse existiert bereits. Wir haben Ihnen eine E-Mail mit einem Bestätigungslink gesendet.'
          };
        } catch (error) {
          console.error('Fehler beim Senden der Verifizierungs-E-Mail:', error);
          return {
            success: false,
            message: 'Eine Anmeldung mit dieser E-Mail-Adresse existiert bereits'
          };
        }
      }

      // Prüfe ob bereits eine Anwendung mit dieser UUID existiert
      const existingByUuid = await this.db.getApplicationByUuid(uuid);
      if (existingByUuid) {
        return {
          success: false,
          message: 'Diese Anfrage wurde bereits verarbeitet'
        };
      }

      // FormData als JSON-String speichern
      const payload = JSON.stringify(formData);

      // In Datenbank speichern
      await this.db.insertApplication({
        email: formData.email,
        uuid,
        payload
      });

      serverLog(`Neue Antragsanmeldung gespeichert: ${formData.email} (UUID: ${uuid})`);

      const workflowService = getWorkflowService();
      const workflowResult = await workflowService.neuesMitglied(formData);

      if(!workflowResult) {
        return {
          success: false,
          message: 'Fehler beim Verarbeiten der Antragsanmeldung'
        };
      }

      return {
        success: true,
        message: 'Antragsanmeldung erfolgreich gespeichert',
        uuid,
        email: formData.email
      };

    } catch (error) {
      console.error('Fehler beim Speichern der Antragsanmeldung:', error);
      return {
        success: false,
        message: 'Interner Serverfehler beim Speichern der Antragsanmeldung'
      };
    }
  }

  /**
   * Ruft eine Antragsanmeldung anhand der E-Mail-Adresse ab
   */
  async getApplicationByEmail(email: string): Promise<FormData | null> {
    try {
      const record = await this.db.getApplicationByEmail(email);
      if (!record || !record.payload) {
        return null;
      }

      return JSON.parse(record.payload);
    } catch (error) {
      console.error('Fehler beim Abrufen der Antragsanmeldung:', error);
      return null;
    }
  }

  /**
   * Ruft eine Antragsanmeldung anhand der UUID ab
   */
  async getApplicationByUuid(uuid: string): Promise<FormData | null> {
    try {
      const record = await this.db.getApplicationByUuid(uuid);
      if (!record || !record.payload) {
        return null;
      }

      return JSON.parse(record.payload);
    } catch (error) {
      console.error('Fehler beim Abrufen der Antragsanmeldung:', error);
      return null;
    }
  }

  /**
   * Ruft alle Antragsanmeldungen ab (mit Pagination)
   */
  async getAllApplications(limit: number = 100, offset: number = 0): Promise<FormData[]> {
    try {
      const records = await this.db.getAllApplications(limit, offset);
      return records
        .filter(record => record.payload)
        .map(record => JSON.parse(record.payload!));
    } catch (error) {
      console.error('Fehler beim Abrufen aller Antragsanmeldungen:', error);
      return [];
    }
  }

  /**
   * Löscht eine Antragsanmeldung anhand der E-Mail-Adresse
   */
  async deleteApplication(email: string): Promise<boolean> {
    try {
      await this.db.deleteApplication(email);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Löscht eine Antragsanmeldung anhand der ID
   */
  async deleteApplicationById(id: number): Promise<boolean> {
    try {
      await this.db.deleteApplicationById(id);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Prüft ob eine Antragsanmeldung mit der gegebenen E-Mail existiert
   */
  async applicationExists(email: string): Promise<boolean> {
    try {
      return await this.db.applicationExists(email);
    } catch (error) {
      console.error('Fehler beim Prüfen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Generiert eine neue UUID für eine Antragsanmeldung
   * Verwendet crypto.randomUUID() als Node.js native Lösung
   */
  generateUuid(): string {
    return generateServerUuid();
  }

  /**
   * Validiert die FormData vor dem Speichern
   */
  validateFormData(formData: FormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Erforderliche Felder prüfen
    const requiredFields = [
      'anrede', 'vorname', 'name', 'email', 'strasse', 'plz', 'ort',
      'hundName', 'mitgliedschaft', 'sepaIban', 'sepaBic', 'sepaKreditinstitut'
    ];

    for (const field of requiredFields) {
      const value = (formData as unknown as Record<string, unknown>)[field];
      if (!value || !value.toString().trim()) {
        errors.push(`${field}:Feld ist erforderlich`);
      }
    }

    // Anrede muss Frau oder Herr sein
    if (formData.anrede && formData.anrede !== 'Frau' && formData.anrede !== 'Herr') {
      errors.push('anrede:Bitte wählen Sie Frau oder Herr');
    }

    // Mitgliedschaft muss ausgewählt sein
    if (!formData.mitgliedschaft || formData.mitgliedschaft.trim() === '') {
      errors.push('mitgliedschaft:Bitte wählen Sie eine Mitgliedschaft');
    }

    // E-Mail-Format prüfen
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('email:Ungültige E-Mail-Adresse');
    }

    // PLZ prüfen (5-stellig)
    if (formData.plz && !/^\d{5}$/.test(formData.plz)) {
      errors.push('plz:PLZ muss 5-stellig sein');
    }

    // IBAN prüfen (vereinfacht)
    if (formData.sepaIban && !/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(formData.sepaIban.replace(/\s/g, ''))) {
      errors.push('sepaIban:Ungültige IBAN');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Singleton-Instanz
let applicationService: ApplicationService | null = null;

export function getApplicationService(): ApplicationService {
  if (!applicationService) {
    applicationService = new ApplicationService();
  }
  return applicationService;
}
