import { db } from '@/services/db'
import type { WurfabnahmeRecord } from '@/types/wurfabnahme-form'

export async function listWurfabnahmen(): Promise<WurfabnahmeRecord[]> {
	return db.wurfabnahmen.orderBy('updatedAt').reverse().toArray()
}

export async function getWurfabnahme(
	id: string,
): Promise<WurfabnahmeRecord | undefined> {
	return db.wurfabnahmen.get(id)
}

export async function saveWurfabnahme(
	record: WurfabnahmeRecord,
): Promise<void> {
	await db.wurfabnahmen.put(record)
}

export async function deleteWurfabnahme(id: string): Promise<void> {
	await db.wurfabnahmen.delete(id)
}
