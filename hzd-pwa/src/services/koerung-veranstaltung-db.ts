import { db } from '@/services/db'
import type { KoerungVeranstaltung } from '@/types/koerung-veranstaltung'

export async function listKoerungVeranstaltungen(): Promise<KoerungVeranstaltung[]> {
	return db.koerungVeranstaltungen.orderBy('updatedAt').reverse().toArray()
}

export async function getKoerungVeranstaltung(
	id: string,
): Promise<KoerungVeranstaltung | undefined> {
	return db.koerungVeranstaltungen.get(id)
}

export async function saveKoerungVeranstaltung(
	veranstaltung: KoerungVeranstaltung,
): Promise<void> {
	await db.koerungVeranstaltungen.put(veranstaltung)
}

export async function deleteKoerungVeranstaltung(id: string): Promise<void> {
	await db.koerungVeranstaltungen.delete(id)
}
