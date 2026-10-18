import { db } from '@/services/db'
import type { Wurfabnahme, WurfabnahmeFormData } from '@/types/wurfabnahme-form'

const DRAFT_ID = 'current'
const AUTOSAVE_INTERVAL_MS = 10_000

let autosaveSession = 0
let autosaveStopped = true
let autosaveTimer: number | null = null
let readAutosaveSnapshot: (() => Omit<WurfabnahmeDraft, 'id' | 'updatedAt'>) | null = null
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

const AUTOSAVE_TIMER_KEY = '__hzdWurfabnahmeAutosaveTimer'

function autosaveWindow(): (Window & {
	[AUTOSAVE_TIMER_KEY]?: number
}) | null {
	if (typeof window === 'undefined') return null
	return window
}

function clearAutosaveTimer() {
	const browser = autosaveWindow()
	if (!browser) return
	const storedTimer = browser[AUTOSAVE_TIMER_KEY]
	if (storedTimer) browser.clearInterval(storedTimer)
	if (autosaveTimer !== null) browser.clearInterval(autosaveTimer)
	autosaveTimer = null
	delete browser[AUTOSAVE_TIMER_KEY]
}

async function writeAutosaveSnapshot(activeSession: number): Promise<void> {
	const snapshot = readAutosaveSnapshot?.()
	if (!snapshot) return

	await enqueueDraftWrite(async () => {
		if (
			autosaveStopped
			|| activeSession !== autosaveSession
			|| !isWurfabnahmeEditorPath()
		) {
			return
		}

		await db.wurfabnahmeDraft.put({
			...snapshot,
			id: DRAFT_ID,
			updatedAt: new Date().toISOString(),
		})

		if (
			autosaveStopped
			|| activeSession !== autosaveSession
			|| !isWurfabnahmeEditorPath()
		) {
			await db.wurfabnahmeDraft.delete(DRAFT_ID)
		}
	})
}

function handleAutosavePageHide() {
	if (autosaveStopped) return
	void writeAutosaveSnapshot(autosaveSession)
}

export function startWurfabnahmeAutosave(
	getSnapshot: () => Omit<WurfabnahmeDraft, 'id' | 'updatedAt'>,
): number {
	pauseWurfabnahmeAutosave()
	autosaveStopped = false
	autosaveSession += 1
	readAutosaveSnapshot = getSnapshot
	const activeSession = autosaveSession
	const browser = autosaveWindow()
	if (!browser) return activeSession
	autosaveTimer = browser.setInterval(() => {
		void writeAutosaveSnapshot(activeSession)
	}, AUTOSAVE_INTERVAL_MS)
	browser[AUTOSAVE_TIMER_KEY] = autosaveTimer
	browser.addEventListener('pagehide', handleAutosavePageHide)
	return activeSession
}

export function pauseWurfabnahmeAutosave() {
	autosaveStopped = true
	autosaveSession += 1
	readAutosaveSnapshot = null
	clearAutosaveTimer()
	if (typeof window !== 'undefined') {
		window.removeEventListener('pagehide', handleAutosavePageHide)
	}
}

export async function discardWurfabnahmeAutosave(): Promise<void> {
	pauseWurfabnahmeAutosave()
	await clearWurfabnahmeDraft()
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
