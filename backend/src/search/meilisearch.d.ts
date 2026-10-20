declare module 'meilisearch' {
	export class Meilisearch {
		constructor(config: { host: string; apiKey?: string })
		tasks: {
			waitForTask(taskUid: number): Promise<{
				status: string
				error?: { message?: string }
			}>
		}
		getIndex(uid: string): Promise<Index>
		index(uid: string): Index
		createIndex(
			uid: string,
			options?: { primaryKey?: string },
		): Promise<{ taskUid: number }>
	}

	export interface Index {
		updateSettings(settings: Record<string, unknown>): Promise<{ taskUid: number }>
		addDocuments(documents: unknown[]): Promise<{ taskUid: number }>
		deleteDocuments(ids: string[]): Promise<{ taskUid: number }>
		deleteDocument(id: string): Promise<{ taskUid: number }>
		getDocuments<T>(params?: {
			fields?: string[]
			limit?: number
			offset?: number
		}): Promise<{ results: T[] }>
	}
}
