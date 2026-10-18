import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Singleton pattern for Prisma client
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    // Stelle sicher, dass das data-Verzeichnis existiert
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('data-Verzeichnis erstellt:', dataDir);
    }
    
    prisma = new PrismaClient();
  }
  return prisma;
}

export interface ApplicationRecord {
  id: number;
  creationDate: Date;
  email: string;
  uuid: string | null;
  payload: string | null;
  verificationSentAt: Date | null;
}

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Initialisiert die Datenbank und erstellt Tabellen falls notwendig
   */
  async initializeDatabase(): Promise<void> {
    try {
      // Prisma erstellt die Tabellen automatisch basierend auf dem Schema
      await this.prisma.$connect();
      console.log('Datenbank erfolgreich initialisiert');
    } catch (error) {
      console.error('Fehler beim Initialisieren der Datenbank:', error);
      throw error;
    }
  }

  /**
   * Fügt eine neue Antragsanmeldung hinzu
   */
  async insertApplication(data: {
    email: string;
    uuid: string;
    payload: string;
  }): Promise<number> {
    try {
      const result = await this.prisma.application.create({
        data: {
          email: data.email,
          uuid: data.uuid,
          payload: data.payload,
          creationDate: new Date(),
        },
      });
      return result.id;
    } catch (error) {
      console.error('Fehler beim Einfügen der Antragsanmeldung:', error);
      throw error;
    }
  }

  /**
   * Ruft die jüngste Antragsanmeldung anhand der E-Mail-Adresse ab
   */
  async getApplicationByEmail(email: string): Promise<ApplicationRecord | null> {
    try {
      const record = await this.prisma.application.findFirst({
        where: { email },
        orderBy: { creationDate: 'desc' },
      });
      return record;
    } catch (error) {
      console.error('Fehler beim Abrufen der Antragsanmeldung:', error);
      return null;
    }
  }

  /**
   * Ruft eine Antragsanmeldung anhand der UUID ab
   */
  async getApplicationByUuid(uuid: string): Promise<ApplicationRecord | null> {
    try {
      const record = await this.prisma.application.findFirst({
        where: { uuid },
      });
      return record;
    } catch (error) {
      console.error('Fehler beim Abrufen der Antragsanmeldung:', error);
      return null;
    }
  }

  /**
   * Ruft alle Antragsanmeldungen ab (mit Pagination)
   */
  async getAllApplications(limit: number = 100, offset: number = 0): Promise<ApplicationRecord[]> {
    try {
      const records = await this.prisma.application.findMany({
        take: limit,
        skip: offset,
        orderBy: { creationDate: 'desc' },
      });
      return records;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Antragsanmeldungen:', error);
      return [];
    }
  }

  /**
   * Löscht eine Antragsanmeldung anhand der ID
   */
  async deleteApplicationById(id: number): Promise<boolean> {
    try {
      await this.prisma.application.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Löscht alle Antragsanmeldungen mit der gegebenen E-Mail-Adresse
   */
  async deleteApplication(email: string): Promise<boolean> {
    try {
      await this.prisma.application.deleteMany({
        where: { email },
      });
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Prüft, ob eine Antragsanmeldung mit der E-Mail existiert
   */
  async applicationExists(email: string): Promise<boolean> {
    try {
      const record = await this.prisma.application.findFirst({
        where: { email },
        select: { id: true },
      });
      return record !== null;
    } catch (error) {
      console.error('Fehler beim Prüfen der Antragsanmeldung:', error);
      return false;
    }
  }

  /**
   * Aktualisiert den Zeitstempel für gesendete Verifizierungs-E-Mail (jüngster Datensatz)
   */
  async updateVerificationSentAt(email: string): Promise<boolean> {
    try {
      // Finde den jüngsten Datensatz
      const latest = await this.prisma.application.findFirst({
        where: { email },
        orderBy: { creationDate: 'desc' },
        select: { id: true },
      });
      
      if (!latest) {
        return false;
      }
      
      // Update über ID (unique)
      await this.prisma.application.update({
        where: { id: latest.id },
        data: { verificationSentAt: new Date() },
      });
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren von verificationSentAt:', error);
      return false;
    }
  }

  /**
   * Schließt die Datenbankverbindung
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}