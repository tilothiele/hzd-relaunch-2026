export interface Image {
	url: string
	alternativeText?: string | null
	width?: number | null
	height?: number | null
	caption?: string | null
	previewUrl?: string | null
}

export interface ActionButton {
	Label?: string | null
	Link?: string | null
	Primary?: boolean | null
}

export interface SlideItem {
	id?: string
	Headline?: string | null
	Subheadline?: string | null
	HeroImage?: Image | null
	ActionButton?: ActionButton | null
}

export interface HeroSectionSlideShow {
	__typename: 'BlocksHeroSectionSlideShow'
	Headline?: SlideItem[] | null
}

export interface CardItem {
	id?: string
	Headline?: string | null
	Subheadline?: string | null
	BackgroundImage?: Image | null
	FarbThema?: 'A' | 'B' | 'C' | null
	ActionButton?: ActionButton | null
}

export interface CardSection {
	__typename: 'BlocksCardSection'
	CardItem?: CardItem[] | null
}

export type StartpageSection = HeroSectionSlideShow | CardSection

export interface Footer {
	ItProjektleitungName?: string | null
	ItProjektleitungOrt?: string | null
	ItProjektleitungTelefon?: string | null
	PraesidiumName?: string | null
	PraesidiumOrt?: string | null
	PraesidiumTelefon?: string | null
}

export interface Startpage {
	Menu?: Menu | null
	Logo?: Image | null
	UnserHovawartImage?: Image | null
	Footer?: Footer | null
	Copyright?: string | null
	SocialLinkFB?: string | null
	SocialLinkYT?: string | null
	Sections?: StartpageSection[] | null
}

export interface Contact {
	id: string
	attributes: {
		title: string
		name: string
		email: string
		phone?: string
		address?: string
		role?: string
		region?: string
		topic?: string
	}
}

export interface Menu {
	items: MenuItem[]
}

export interface MenuItem {
	name: string
	url?: string
	children?: MenuItem[]
}

export interface AuthUser {
	id: number
	username?: string | null
	email?: string | null
}
