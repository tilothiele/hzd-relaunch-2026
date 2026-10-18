import { db } from '@/services/db'
import type { Wurfabnahme, WurfabnahmeFormData } from '@/types/wurfabnahme-form'

const DRAFT_ID = 'current'

export interface WurfabnahmeDraft {
	id: typeof DRAFT_ID
	recordId: string | null
	formData: WurfabnahmeFormData
	deletedWelpenIds: string[]
	activeTab: string
	updatedAt: string
}

export async function getWurfabnahmeDraft(): Promise<WurfabnahmeDraft | null> {
	const draft = await db.wurfabnahmeDraft.get(DRAFT_ID)
	return (draft as WurfabnahmeDraft | undefined) ?? null
}

export async function saveWurfabnahmeDraft(
	draft: Omit<WurfabnahmeDraft, 'id' | 'updatedAt'>,
): Promise<void> {
	await db.wurfabnahmeDraft.put({
		...draft,
		id: DRAFT_ID,
		updatedAt: new Date().toISOString(),
	})
}

export async function clearWurfabnahmeDraft(): Promise<void> {
	await db.wurfabnahmeDraft.delete(DRAFT_ID)
}

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
