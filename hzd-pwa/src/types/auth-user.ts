export interface AuthUser {
	id: string
	documentId: string
	username: string
	email?: string | null
	firstName?: string | null
	lastName?: string | null
}
