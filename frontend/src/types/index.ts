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
	__typename: 'ComponentBlocksHeroSectionSlideShow'
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
	__typename: 'ComponentBlocksCardSection'
	CardItem?: CardItem[] | null
}

export interface RichTextSection {
	__typename: 'ComponentBlocksRichTextSection'
	RichTextContent?: string | null
}

export type StartpageSection = HeroSectionSlideShow | CardSection | RichTextSection

export type PageSection = StartpageSection

export interface Page {
	slug?: string | null
	title?: string | null
	Sections?: PageSection[] | null
}

export interface Footer {
	ItProjektleitungName?: string | null
	ItProjektleitungOrt?: string | null
	ItProjektleitungTelefon?: string | null
	PraesidiumName?: string | null
	PraesidiumOrt?: string | null
	PraesidiumTelefon?: string | null
}

export interface GlobalLayout {
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
	title: string
	name: string
	email: string
	phone?: string | null
	address?: string | null
	role?: string | null
	region?: string | null
	topic?: string | null
}

export interface ContactData {
	data: Contact[]
}

export interface HomepageSection {
	title: string
	text: string
	buttonText?: string | null
	buttonLink?: string | null
	backgroundColor?: string | null
	textColor?: string | null
	order?: number | null
}

export interface HomepageSectionData {
	data: HomepageSection[]
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

export interface Dog {
	documentId: string
	givenName?: string | null
	fullKennelName?: string | null
	sex?: 'M' | 'F' | null
	color?: 'S' | 'SM' | 'B' | null
	dateOfBirth?: string | null
	dateOfDeath?: string | null
	microchipNo?: string | null
	avatar?: {
		url?: string | null
		alternativeText?: string | null
		width?: number | null
		height?: number | null
	} | null
}

export interface DogSearchResult {
	hzdPluginDogs: Dog[]
}

export interface Breeder {
	documentId: string
	kennelName?: string | null
	breedingLicenseSince?: string | null
	member?: {
		fullName?: string | null
		region?: string | null
		phone?: string | null
		adress1?: string | null
		adress2?: string | null
		zip?: string | null
		countryCode?: string | null
	} | null
}

export interface BreederSearchResult {
	hzdPluginBreeders: Breeder[]
}

export interface Litter {
	documentId: string
	dateOfManting?: string | null
	expectedDateOfBirth?: string | null
	dateOfBirth?: string | null
	closed?: boolean | null
	breeder?: {
		kennelName?: string | null
		member?: {
			fullName?: string | null
		} | null
	} | null
	mother?: {
		fullKennelName?: string | null
		givenName?: string | null
	} | null
	stuntDog?: {
		fullKennelName?: string | null
		givenName?: string | null
	} | null
}

export interface LitterSearchResult {
	hzdPluginLitters: Litter[]
}

export interface IndexPage {
	Sections?: StartpageSection[] | null
}

export interface PagesQueryResult {
	pages?: Page[] | null
}

export interface IndexPageQueryResult {
	indexPage: IndexPage
}

export interface GlobalLayoutQueryResult {
	globalLayout: GlobalLayout
}

export interface ContactsQueryResult {
	hzdPluginContacts: ContactData
}

export interface HomepageSectionsQueryResult {
	hzdPluginHomepageSections: HomepageSectionData
}
