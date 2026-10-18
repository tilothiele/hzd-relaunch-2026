// Server-only utilities für Backend-spezifische Funktionen
// Diese Datei sollte nur im Backend (API-Routes) verwendet werden

/**
 * Server-only UUID Generation
 * Verwendet Node.js crypto.randomUUID() oder Fallback
 */
export function generateServerUuid(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Server-only function called in client environment');
  }
  
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback für ältere Node.js Versionen
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Server-only Environment Check
 */
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

/**
 * Server-only Logging
 */
export function serverLog(message: string, data?: unknown): void {
  if (typeof window !== 'undefined') {
    throw new Error('Server-only function called in client environment');
  }
  
  console.log(`[SERVER] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}
