const MESSAGE_MAP: Record<string, string> = {
	'Invalid identifier or password':
		'E-Mail/Benutzername oder Passwort ist ungültig.',
	'Your account email is not confirmed':
		'Ihre E-Mail-Adresse ist noch nicht bestätigt.',
	'Your account has been blocked by an administrator':
		'Ihr Konto wurde gesperrt.',
	'This provider is disabled':
		'Die Anmeldung ist derzeit nicht verfügbar.',
}

export function mapStrapiAuthError(message: string | undefined): string {
	if (!message) {
		return 'Die Anfrage ist fehlgeschlagen. Bitte versuchen Sie es erneut.'
	}

	return MESSAGE_MAP[message] ?? message
}
