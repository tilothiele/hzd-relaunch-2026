export interface ThemeDefinition {
	headerBackground: string
	footerBackground: string
	headlineColor: string
	textColor: string
	buttonColor: string
	buttonTextColor: string
	headerFooterTextColor: string
	oddBgColor: string
	evenBgColor: string
	cardsBackground: string
	cardsText: string
}

export const theme: ThemeDefinition = {
	headerBackground: 'var(--color-primary)',
	footerBackground: 'var(--color-primary)',
	headerFooterTextColor: 'var(--color-negative-text)',
	headlineColor: 'var(--color-text-headline)',
	textColor: 'var(--color-text)',
	buttonColor: 'var(--color-primary)',
	buttonTextColor: 'var(--color-negative-text)',
	oddBgColor: 'var(--color-bg-gray)',
	evenBgColor: 'var(--color-white)',
	cardsBackground: 'var(--color-cards-background)',
	cardsText: 'var(--color-cards-text)',
}

