export interface ThemeDefinition {
	headerBackground: string
	footerBackground: string

	drawerText: string
	drawerBackground: string

	imageCardSectionText: string

	headlineColor: string
	textColor: string
	buttonColor: string
	buttonTextColor: string
	headerFooterTextColor: string
	oddBgColor: string
	evenBgColor: string
	cardsBackground: string
	cardsText: string
	heroSlideShowText: string

	submitButtonColor: string
	submitButtonTextColor: string

	socialIcon: string
}

export const theme: ThemeDefinition = {
	drawerText: 'var(--color-drawer-text)',
	drawerBackground: 'var(--color-drawer-background)',

	submitButtonColor: 'var(--color-submit-button)',
	submitButtonTextColor: 'var(--color-submit-button-text)',

	headerBackground: 'var(--color-header-footer-background)',
	footerBackground: 'var(--color-header-footer-background)',
	headerFooterTextColor: 'var(--color-header-footer-text)',

	imageCardSectionText: 'var(--color-image-card-section-text)',

	heroSlideShowText: 'var(--color-hero-slide-show-text)',

	socialIcon: 'var(--color-social-icon)',

	headlineColor: 'var(--color-text-headline)',
	textColor: 'var(--color-text)',

	buttonColor: 'var(--color-action-primary)',
	buttonTextColor: 'var(--color-action-primary-text)',

	oddBgColor: 'var(--color-bg-gray)',
	evenBgColor: 'var(--color-white)',
	cardsBackground: 'var(--color-cards-background)',
	cardsText: 'var(--color-cards-text)',
}

