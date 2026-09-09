export interface AuthUser {
	id: string
	documentId: string
	username: string
	email?: string | null
	firstName?: string | null
	lastName?: string | null
	user_groups?: Array<{
		id?: number | string | null
		documentId?: string | null
		Name?: string | null
	}> | null
}
