export interface ThemeDefinition {
	headerBackground: string
	footerBackground: string

	drawerText: string
	drawerBackground: string
	drawerHandle: string

	imageCardSectionText: string

	headlineColor: string
	textColor: string

	buttonColor: string
	buttonTextColor: string
	buttonHoverColor: string

	secondaryButtonColor: string
	secondaryButtonTextColor: string
	secondaryButtonHoverColor: string

	headerFooterTextColor: string
	oddBgColor: string
	evenBgColor: string
	cardsBackground: string
	cardsText: string
	cardsTextHeadline: string
	cardsTextSubheadline: string
	heroSlideShowText: string

	submitButtonColor: string
	submitButtonTextColor: string

	socialIcon: string

	loginIcon: string
}

export const theme: ThemeDefinition = {
	drawerText: 'var(--color-drawer-text)',
	drawerBackground: 'var(--color-drawer-background)',
	drawerHandle: 'var(--color-drawer-handle)',

	submitButtonColor: 'var(--color-submit-button)',
	submitButtonTextColor: 'var(--color-submit-button-text)',

	headerBackground: 'var(--color-header-footer-background)',
	footerBackground: 'var(--color-header-footer-background)',
	headerFooterTextColor: 'var(--color-header-footer-text)',

	imageCardSectionText: 'var(--color-image-card-section-text)',

	heroSlideShowText: 'var(--color-hero-slide-show-text)',

	socialIcon: 'var(--color-social-icon)',

	loginIcon: 'var(--color-login-icon)',

	headlineColor: 'var(--color-text-headline)',
	textColor: 'var(--color-text)',

	buttonColor: 'var(--color-action-primary)',
	buttonHoverColor: 'var(--color-action-primary-hover)',
	buttonTextColor: 'var(--color-action-primary-text)',

	secondaryButtonColor: 'var(--color-action-secondary)',
	secondaryButtonHoverColor: 'var(--color-action-secondary-hover)',
	secondaryButtonTextColor: 'var(--color-action-secondary-text)',

	oddBgColor: 'var(--color-odd-section-background)',
	evenBgColor: 'var(--color-white)',

	cardsBackground: 'var(--color-cards-background)',
	cardsTextHeadline: 'var(--color-cards-text-headline)',
	cardsTextSubheadline: 'var(--color-cards-text-subheadline)',
	cardsText: 'var(--color-cards-text)',
}

