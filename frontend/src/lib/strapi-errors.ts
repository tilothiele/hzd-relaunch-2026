export class StrapiUnauthorizedError extends Error {
	readonly status = 401

	constructor(message = 'Nicht authentifiziert') {
		super(message)
		this.name = 'StrapiUnauthorizedError'
	}
}

/** @deprecated Use StrapiUnauthorizedError */
export const GraphQLUnauthorizedError = StrapiUnauthorizedError

export function isUnauthorizedMessage(message: string): boolean {
	const normalized = message.toLowerCase()
	return normalized.includes('401')
		|| normalized.includes('unauthorized')
		|| normalized.includes('nicht authentifiziert')
		|| normalized.includes('jwt expired')
		|| normalized.includes('invalid token')
		|| normalized.includes('forbidden')
}

export function isStrapiUnauthorizedError(error: unknown): boolean {
	if (error instanceof StrapiUnauthorizedError) {
		return true
	}

	if (error instanceof Error) {
		return isUnauthorizedMessage(error.message)
	}

	return false
}

/** @deprecated Use isStrapiUnauthorizedError */
export const isGraphQLUnauthorizedError = isStrapiUnauthorizedError

export function resolveStrapiErrorStatus(error: unknown): number {
	if (error instanceof StrapiUnauthorizedError) {
		return 401
	}

	if (error && typeof error === 'object' && 'response' in error) {
		const response = (error as { response?: { status?: number } }).response
		const status = response?.status
		if (status === 401 || status === 403) {
			return 401
		}
	}

	if (error instanceof Error && isUnauthorizedMessage(error.message)) {
		return 401
	}

	return 500
}

/** @deprecated Use resolveStrapiErrorStatus */
export const resolveGraphQLErrorStatus = resolveStrapiErrorStatus
