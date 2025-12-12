/**
 * Client-Funktion zum Abrufen von form instances als CSV
 * Filtert nach EventAdmin des aktuell angemeldeten Benutzers
 * @param token - JWT Token des angemeldeten Benutzers
 * @returns Promise mit CSV-String
 */
export async function getFormInstancesCsv(token: string): Promise<string> {
	const response = await fetch('/api/forms/instances/csv', {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		const errorData = await response.json().catch(() => null)
		const errorMessage = errorData?.error?.message ?? 'Form instances konnten nicht abgerufen werden'
		throw new Error(errorMessage)
	}

	return await response.text()
}


