import nodemailer, { type Transporter } from 'nodemailer';
import { serverLog } from '../lib/server-only';
import { renderEmailTemplate } from '../lib/email-templates';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Initialisiert den E-Mail-Transporter basierend auf Umgebungsvariablen
   */
  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Prüfe ob SMTP konfiguriert ist
    if (!process.env.SMTP_HOST) {
      console.warn('SMTP_HOST nicht konfiguriert - E-Mail-Versand wird übersprungen');
      serverLog('WARNUNG: SMTP nicht konfiguriert');
    }

    // Konfiguration aus Umgebungsvariablen
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
    };

    // Optional: SMTP-Authentifizierung
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    console.log('SMTP Konfiguration:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      hasAuth: !!config.auth
    });

    this.transporter = nodemailer.createTransport(config);
    return this.transporter;
  }

  /**
   * Sendet eine Verifizierungs-E-Mail mit einem Link
   */
  async sendVerificationEmail(
    email: string,
    uuid: string,
    baseUrl: string
  ): Promise<boolean> {
    try {
      const verificationLink = `${baseUrl}/verify-email?uuid=${uuid}&email=${encodeURIComponent(email)}`;

      // Template-Variablen
      const templateVariables = {
        VERIFICATION_LINK: verificationLink,
      };

      // Lade und rendere Templates
      const htmlContent = renderEmailTemplate('email-verification', 'html', templateVariables);
      const textContent = renderEmailTemplate('email-verification', 'txt', templateVariables);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@hzd-og-hamburg.de',
        to: email,
        subject: 'Bestätigung Ihrer Anmeldung - HZD OG Hamburg',
        html: htmlContent,
        text: textContent,
      };

      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);

      serverLog(`Verifizierungs-E-Mail gesendet an ${email}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Verifizierungs-E-Mail:', error);
      return false;
    }
  }

  /**
   * Sendet eine Bestätigungs-E-Mail nach erfolgreicher Anmeldung
   */
  async sendConfirmationEmail(
    email: string,
    formData: {
      vorname: string;
      name: string;
      mitgliedschaft: string;
    }
  ): Promise<boolean> {
    try {
      console.log('Starte E-Mail-Versand für Bestätigung an:', email);
      
      // Template-Variablen
      const templateVariables = {
        EMAIL: email,
        VORNAME: formData.vorname,
        NAME: formData.name,
        MITGLIEDSCHAFT: formData.mitgliedschaft,
      };

      console.log('Template-Variablen:', templateVariables);

      // Lade und rendere Templates
      const htmlContent = renderEmailTemplate('application-confirmation', 'html', templateVariables);
      const textContent = renderEmailTemplate('application-confirmation', 'txt', templateVariables);

      console.log('Templates erfolgreich geladen');

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@hzd-og-hamburg.de',
        to: email,
        subject: 'Vorläufige Bestätigung Ihrer Anmeldung - HZD OG Hamburg',
        html: htmlContent,
        text: textContent,
      };

      console.log('Mail-Optionen vorbereitet, sende E-Mail...');

      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      console.log('E-Mail erfolgreich gesendet, MessageID:', info.messageId);
      serverLog(`Bestätigungs-E-Mail gesendet an ${email}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', error);
      console.error('Error Details:', error instanceof Error ? error.message : String(error));
      serverLog(`FEHLER beim E-Mail-Versand an ${email}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Testet die E-Mail-Konfiguration
   */
  async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      serverLog('E-Mail-Verbindung erfolgreich getestet');
      return true;
    } catch (error) {
      console.error('Fehler beim Testen der E-Mail-Verbindung:', error);
      return false;
    }
  }
}

// Singleton-Instanz
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

