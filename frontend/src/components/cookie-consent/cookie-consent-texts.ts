/**
 * Zentrale Texte für die Cookie-Einwilligung (DSGVO).
 *
 * Diese Texte werden sowohl im Cookie-Banner als auch auf der
 * „Cookie-Einstellungen"-Seite verwendet, damit beide die identischen
 * Inhalte zeigen und die Texte an genau einer Stelle bearbeitet
 * werden können.
 */
export const COOKIE_CONSENT = {
	// Hinweis: Titel wurde bereits im Banner angepasst – hier als zentrale Quelle übernommen.
	title: 'Datenschutz / Einstellung der Privatsphäre',

	// Haupttext (ohne dynamische Links). Identisch in Banner und Einstellungen.
	body: 'Wir verwenden nur notwendige Cookies, um Funktionen wie ggf. Login oder die Website gegen Missbrauch durch böswillige Bots zu schützen. Sie können hier ihre Einwilligung für die Verwendung externer Links geben. Sie dienen dazu, externes Kartenmaterial von openstreetmap für die Anzeige der Positionen z.B. von Züchtern einzusehen. Sie können Ihre Entscheidung jederzeit in den Datenschutz-Einstellungen anpassen.',

	// Link-Label zur Datenschutzerklärung (URL kommt aus dem Layout).
	privacyLinkLabel: 'für nähere Informationen lesen Sie bitte unsere Datenschutzerklärung',

	// Statischer Impressum-Link.
	impressum: {
		href: '/impressum',
		label: 'Impressum',
	},

	acceptLabel: 'Alle akzeptieren',
	rejectLabel: 'keine externen Inhalte abrufen',
} as const
