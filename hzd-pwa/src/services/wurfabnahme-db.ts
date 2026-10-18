import { db } from '@/services/db'
import type { Wurfabnahme, WurfabnahmeFormData } from '@/types/wurfabnahme-form'

const DRAFT_ID = 'current'

let autosaveSession = 0
let draftWriteQueue: Promise<void> = Promise.resolve()

function isWurfabnahmeEditorPath(): boolean {
	if (typeof window === 'undefined') return false
	const path = window.location.pathname.replace(/\/$/, '') || '/'
	if (path === '/wurfabnahmen/neu') return true
	return /^\/wurfabnahmen\/[^/]+$/.test(path)
}

function enqueueDraftWrite(task: () => Promise<void>): Promise<void> {
	const run = draftWriteQueue.then(task, task)
	draftWriteQueue = run.then(() => undefined, () => undefined)
	return run
}

export function beginWurfabnahmeAutosave(): number {
	autosaveSession += 1
	return autosaveSession
}

export function endWurfabnahmeAutosave(session: number) {
	if (autosaveSession === session) {
		autosaveSession += 1
	}
}

export function suspendWurfabnahmeAutosave() {
	autosaveSession += 1
}

export function isWurfabnahmeAutosaveActive(session: number): boolean {
	return session !== 0
		&& session === autosaveSession
		&& isWurfabnahmeEditorPath()
}

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
	session: number,
	draft: Omit<WurfabnahmeDraft, 'id' | 'updatedAt'>,
): Promise<void> {
	await enqueueDraftWrite(async () => {
		if (!isWurfabnahmeAutosaveActive(session)) return
		await db.wurfabnahmeDraft.put({
			...draft,
			id: DRAFT_ID,
			updatedAt: new Date().toISOString(),
		})
	})
}

export async function clearWurfabnahmeDraft(): Promise<void> {
	await enqueueDraftWrite(async () => {
		await db.wurfabnahmeDraft.delete(DRAFT_ID)
	})
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
