import { db } from '@/services/db'
import type { Wurfabnahme } from '@/types/wurfabnahme-form'

export async function listWurfabnahmen(): Promise<Wurfabnahme[]> {
	return db.wurfabnahmen.orderBy('updatedAt').reverse().toArray()
}

export async function getWurfabnahme(
	id: string,
): Promise<Wurfabnahme | undefined> {
	return db.wurfabnahmen.get(id)
}

export async function saveWurfabnahme(
	wurfabnahme: Wurfabnahme,
): Promise<void> {
	await db.wurfabnahmen.put(wurfabnahme)
}

export async function deleteWurfabnahme(id: string): Promise<void> {
	await db.wurfabnahmen.delete(id)
}
