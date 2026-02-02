import type { BlocksContent } from '@strapi/blocks-react-renderer'

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
	TeaserText?: string | null
	BackgroundImage?: Image | null
	ActionButton?: ActionButton | null
}

export interface CardSection {
	__typename: 'ComponentBlocksCardSection'
	id?: string
	CardHeadline?: string | null
	CardColumnsOddEven?: 'Odd' | 'Even' | null
	CardItem?: CardItem[] | null
	CardsAnchor?: string | null
	CardLayout?: 'Full_Cover' | 'Bordered_Box' | null
}

export interface RichTextSection {
	__typename: 'ComponentBlocksRichTextSection'
	Title?: string | null
	Subtitle?: string | null
	RichTextOddEven?: 'Odd' | 'Even' | null
	RichTextContent?: string | null
	RichTextAnchor?: string | null
}

export interface File {
	url: string
	name?: string | null
	ext?: string | null
	mime?: string | null
	size?: number | null
}

export interface SupplementalDocument {
	documentId?: string
	Name?: string | null
	Description?: string | unknown | null // Blocks field - can be JSON object, JSON string or HTML depending on Strapi version
	ShortId?: string | null
	SortOrd?: number | null
	DownloadDocument?: File[] | null
	VisibilityStart?: string | null
	VisibilityEnd?: string | null
}

export interface SupplementalDocumentGroup {
	documentId?: string
	Name?: string | null
	SortOrd?: number | null
	supplemental_documents?: SupplementalDocument[] | null
}

export interface SupplementalDocumentGroupSection {
	__typename: 'ComponentBlocksSupplementalDocumentGroupSection'
	SupplementalsOddEven?: 'Odd' | 'Even' | null
	GroupHeadline?: string | null
	supplemental_document_group?: SupplementalDocumentGroup | null
	GroupAnchor?: string | null
}

export interface TeaserTextWithImageSection {
	__typename: 'ComponentBlocksTeaserTextWithImage'
	TeaserOddEven?: 'Odd' | 'Even' | null
	TeaserHeadline?: string | null
	TeaserText?: string | null
	Image?: Image | null
	ImagePosition?: 'left' | 'right' | null
	ActionButton?: ActionButton | null
	TeaserAnchor?: string | null
}

export interface BulletItem {
	id?: string
	Headline?: string | null
	ItemBody?: string | null
}

export interface TextColumn {
	id?: string
	ColumnHeadline?: string | null
	ColumnText?: string | null
	ColumnActionButton?: ActionButton | null
	BulletItems?: BulletItem[] | null
}

export interface TextColumnsSection {
	__typename: 'ComponentBlocksTextColumnsSection'
	TextColumnsOddEven?: 'Odd' | 'Even' | null
	TextColumnsHeadline?: string | null
	TextColumnsSubHeadline?: string | null
	TextColumn?: TextColumn[] | null
	TextColumnsAnchor?: string | null
}

export interface ImageGallerySection {
	__typename: 'ComponentBlocksImageGallerySection'
	GalleryHeadline?: string | null
	GalleryImages?: Image[] | null
	ImageGalleryAnchor?: string | null
}

export interface SimpleCtaSection {
	__typename: 'ComponentBlocksSimpleCtaSection'
	CtaHeadline?: string | null
	CtaInfoText?: BlocksContent | null
	CtaBackgroundImage?: Image | null
	CtaActionButton?: (ActionButton | null)[] | null
	SimpleCtaAnchor?: string | null
}

export interface SimpleHeroSection {
	__typename: 'ComponentBlocksSimpleHeroSection'
	HeroAnchor?: string | null
	HeroHeadline?: string | null
	HeroTeaser?: string | null
	HeroImage?: Image | null
	HeroLayout?: 'Image_left' | 'Image_right' | 'full_width' | null
	HeroCta?: ActionButton | null
	FullWidth?: boolean | null
	ShowLog?: boolean | null
	FadingBorder?: boolean | null
}

export interface ContactGroupSection {
	__typename: 'ComponentBlocksContactGroupSection'
	ContactGroup?: ContactGroup | null
	ContactGroupAnchor?: string | null
}

export interface EmailAddressOption {
	id: string
	Email: string
	DisplayName?: string | null
}

export interface ContactMailerSection {
	__typename: 'ComponentBlocksContactMailerSection'
	id?: string
	ContactMailerAnchor?: string | null
	ContactMailerHeadline?: string | null
	ContactMailerInfotext?: string | null
	ReceipientOptions?: EmailAddressOption[] | null
}

export interface NewsArticlesSection {
	__typename: 'ComponentBlocksNewsArticlesSection'
	id: string
	MaxArticles?: number | null
	news_article_category?: {
		documentId: string
	} | null
	NewsArticlesAnchor?: string | null
}

export type StartpageSection = HeroSectionSlideShow | CardSection | RichTextSection | SupplementalDocumentGroupSection | TeaserTextWithImageSection | TextColumnsSection | ImageGallerySection | SimpleCtaSection | ContactGroupSection | NewsArticlesSection | ContactMailerSection | SimpleHeroSection

export type PageSection = StartpageSection

export interface ComponentPermissionRestriction {
	id: string
	Public: boolean
	Authenticated: boolean
}

export interface Page {
	slug?: string | null
	title?: string | null
	LogoBackground?: boolean | null
	Restriction?: ComponentPermissionRestriction | null
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

export interface PartnerLink {
	id?: string
	Logo?: Image | null
	PartnerLinkUrl?: string | null
	AltText?: string | null
}

export interface HzdSetting {
	DefaultAvatarS?: Image | null
	DefaultAvatarSM?: Image | null
	DefaultAvatarB?: Image | null
}

export interface GlobalLayout {
	Logo?: Image | null
	Footer?: Footer | null
	Menu?: Menu | null
	MenuStyle: 'Classic' | 'StickyTransparent'
	DrawerMenu?: Menu | null
	Copyright?: string | null
	SocialLinkFB?: string | null
	SocialLinkYT?: string | null
	HzdSetting?: HzdSetting | null
	SOS?: ComponentLayoutSOS | null
	Sections?: StartpageSection[] | null
	PartnerLink?: PartnerLink[] | null
	PrivacyPolicy?: Image | null
	page?: Page | null
}

export interface ComponentLayoutSOS {
	ShowSOS: boolean
	SosTitle?: string | null
	SosLink?: string | null
}

export interface Contact {
	documentId: string
	avatar?: Image | null
	position?: number | null
	member?: {
		documentId: string
		firstName?: string | null
		lastName?: string | null
	} | null
	contact_group?: ContactGroup | null
	Headline?: string | null
	Name?: string | null
	Street?: string | null
	ZipCity?: string | null
	Phone?: string | null
	Email1?: string | null
	Email2?: string | null
	Introduction?: string | null
	createdAt?: string | null
	updatedAt?: string | null
	publishedAt?: string | null
}

export interface ContactGroup {
	documentId: string
	ContactGroupName?: string | null
	GroupDescription?: unknown | null
	contacts?: Contact[] | null
	createdAt?: string | null
	updatedAt?: string | null
	publishedAt?: string | null
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
	id?: string
	faIcon?: string
	url?: string
	icon?: string // Added icon for DrawerMenu
	children?: MenuItem[]
}

export interface UsersPermissionsMeRole {
	id: string
	name: string
	description?: string | null
	type?: string | null
}

export interface AuthUser {
	id: string
	documentId: string
	username: string
	email?: string | null
	confirmed?: boolean | null
	blocked?: boolean | null
	role?: UsersPermissionsMeRole | null
	title?: string | null
	membershipNumber?: number | null
	dateOfBirth?: string | null
	firstName?: string | null
	lastName?: string | null
	address1?: string | null
	address2?: string | null
	countryCode?: string | null
	zip?: string | null
	city?: string | null
	phone?: string | null
	geoLocation?: GeoLocation | null
}

export interface PuppyAmount {
	id?: string
	Total?: number | null
	Available?: number | null
}

export interface GeoLocation {
	lat: number
	lng: number
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
	cStudBookNumber?: string | null
	father?: Dog | null
	mother?: Dog | null
	owner?: {
		documentId: string
		firstName?: string | null
		lastName?: string | null
		address1?: string | null
		address2?: string | null
		zip?: string | null
		city?: string | null
		countryCode?: string | null
		phone?: string | null
		email?: string | null
	} | null
	Location?: GeoLocation | null
	cFertile?: boolean | null
	Exhibitions?: string | null
	BreedSurvey?: string | null
	withersHeight?: string | null
	BreedersIntroduction?: string | null
	MemosReleased?: string | null
	breeder?: {
		BreedersIntroduction?: string | null
	} | null
	Images?: Image[] | null
	avatar?: Image | null
}

export interface DogSearchResult {
	hzdPluginDogs_connection: {
		nodes: Dog[]
		pageInfo: {
			total: number
			page: number
			pageSize: number
			pageCount: number
		}
	}
}

export interface Address {
	id: string
	FullName?: string | null
	Address1?: string | null
	Address2?: string | null
	CountryCode?: string | null
	Zip?: string | null
	City?: string | null
}

export interface Breeder {
	documentId: string
	kennelName?: string | null
	breedingLicenseSince?: string | null
	member?: {
		documentId: string
		firstName?: string | null
		lastName?: string | null
		region?: string | null
		phone?: string | null
		email?: string | null
		city?: string | null
		address1?: string | null
		address2?: string | null
		zip?: string | null
		countryCode?: string | null
		geoLocation?: GeoLocation | null
	} | null
	IsActive?: boolean | null
	Disable?: boolean | null
	BreedersIntroduction?: string | null
	BreedersIntroDraft?: string | null
	isDirty?: boolean | null
	WebsiteUrl?: string | null
	WebsiteUrlDraft?: string | null
	InternalNotes?: string | null
	GeoLocation?: GeoLocation | null
	avatar?: Image | null
	Address?: Address | null
}

export interface BreederSearchResult {
	hzdPluginBreeders_connection: {
		nodes: Breeder[]
		pageInfo: {
			total: number
			page: number
			pageSize: number
			pageCount: number
		}
	}
}

export interface Litter {
	documentId: string
	dateOfManting?: string | null
	expectedDateOfBirth?: string | null
	dateOfBirth?: string | null
	LitterStatus: 'Planned' | 'Manted' | 'Littered' | 'Closed'
	StatusMessage?: string | null
	StatusMessageDraft?: string | null
	StatusMessageDirtyFlag?: boolean | null
	AmountRS?: PuppyAmount | null
	AmountRSM?: PuppyAmount | null
	AmountRB?: PuppyAmount | null
	AmountHS?: PuppyAmount | null
	AmountHSM?: PuppyAmount | null
	AmountHB?: PuppyAmount | null
	OrderLetter: string
	breeder?: Breeder | null
	mother?: {
		documentId: string
		fullKennelName?: string | null
		givenName?: string | null
		avatar?: Image | null
		color?: 'S' | 'SM' | 'B' | null
	} | null
	stuntDog?: {
		documentId: string
		fullKennelName?: string | null
		givenName?: string | null
		avatar?: Image | null
		color?: 'S' | 'SM' | 'B' | null
	} | null
	PuppyImage?: Image | null
}

export interface LitterSearchResult {
	hzdPluginLitters_connection: {
		nodes: Litter[]
		pageInfo: {
			total: number
			page: number
			pageSize: number
			pageCount: number
		}
	}
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
	hzdSetting?: HzdSetting | null
}

export interface ContactsQueryResult {
	hzdPluginContacts: ContactData
}

export interface HomepageSectionsQueryResult {
	hzdPluginHomepageSections: HomepageSectionData
}

export interface Calendar {
	documentId: string
	Name?: string | null
	ColorSchema?: string | null
}

export interface CalendarItem {
	documentId: string
	Headline: string
	Description?: BlocksContent | any | null
	Date?: string | null
	Time?: string | null
	DateTo?: string | null
	LongDescription?: string | null
	AnmeldeLink?: string | null
	ErgebnisLink?: string | null
	ErgebnisText?: string | null
	Region?: string | null
	form?: {
		documentId: string
	} | null
	CalendarDocument?: {
		MediaFile?: {
			url: string
			name?: string | null
			ext?: string | null
			alternativeText?: string | null
		} | null
	}[] | null
	calendar?: Calendar | null
	VisibleFrom?: string | null
	VisibleTo?: string | null
	DueDate?: string | null
	createdAt?: string | null
	updatedAt?: string | null
	publishedAt?: string | null
}

export interface CalendarSearchResult {
	calendars: Calendar[]
}

export interface CalendarItemSearchResult {
	calendarEntries: CalendarItem[]
}

export interface ShortTextInput {
	__typename: 'ComponentFormShortTextInput'
	id?: string
	MinLength?: number | null
	MultiLine?: boolean | null
	STName?: string | null
}

export interface EmailAddress {
	__typename: 'ComponentFormEmailAdress'
	id?: string
	EAName?: string | null
	EARequired?: boolean | null
}

export interface TextArea {
	__typename: 'ComponentFormTextArea'
	id?: string
	TAName?: string | null
}

export interface NumberInput {
	__typename: 'ComponentFormNumberInput'
	id?: string
	NIName?: string | null
	NIMinValue?: number | null
	NIMaxValue?: number | null
	NIRequired?: boolean | null
}

export interface Choice {
	__typename: 'ComponentFormChoice'
	id?: string
	CName?: string | null
	CRequired?: boolean | null
	MultipleChoice?: boolean | null
	Options?: string[] | null
}

export interface BooleanChoice {
	__typename: 'ComponentFormBooleanChoice'
	id?: string
	BCName?: string | null
	BCRequired?: boolean | null
	BCRequiredValue?: boolean | null
}

export interface GroupSeparator {
	__typename: 'ComponentFormFldGroupSeparator'
	id?: string
	GroupName?: string | null
}

export interface StaticText {
	__typename: 'ComponentFormFldStaticText'
	id?: string
	StaticContent?: string | null
}

export interface StandardIdentifier {
	__typename: 'ComponentFormStandardIdentifiers'
	id?: string
	EMail?: 'Erforderlich' | 'Ja' | 'Nein' | null
	MembershipNumber?: 'Erforderlich' | 'Ja' | 'Nein' | null
	FirstName?: 'Erforderlich' | 'Ja' | 'Nein' | null
	LastName?: 'Erforderlich' | 'Ja' | 'Nein' | null
	Street?: 'Erforderlich' | 'Ja' | 'Nein' | null
	Zip?: 'Erforderlich' | 'Ja' | 'Nein' | null
	City?: 'Erforderlich' | 'Ja' | 'Nein' | null
	CountryCode?: 'Erforderlich' | 'Ja' | 'Nein' | null
	Phone?: 'Erforderlich' | 'Ja' | 'Nein' | null
}

export interface FormSubmitButton {
	__typename: 'ComponentFormFormSubmitButton'
	id?: string
	FSBName?: string | null
}

export type FormField = ShortTextInput | EmailAddress | TextArea | NumberInput | Choice | BooleanChoice | GroupSeparator | StaticText | FormSubmitButton | StandardIdentifier

export interface Form {
	documentId: string
	Name?: string | null
	EventAdmin?: {
		documentId: string
		firstName?: string | null
		lastName?: string | null
	} | null
	InclPrivacyPolicy?: boolean | null
	ThankYouMessage?: string | null
	FormFields?: FormField[] | null
	createdAt?: string | null
	updatedAt?: string | null
}

export interface FormQueryResult {
	forms: Form[]
}

export interface FormInstance {
	documentId: string
	form?: {
		documentId: string
		Name?: string | null
	} | null
	Content?: Record<string, unknown> | null
	createdAt?: string | null
	updatedAt?: string | null
}

export interface FormSearchResult {
	forms: Form[]
}

export interface FormInstanceSearchResult {
	formInstances: FormInstance[]
}

export interface CreateFormInstanceResult {
	createFormInstance: {
		data: FormInstance
	}
}

export interface SEO {
	MetaTitle?: string | null
	MetaDescription?: string | null
	MetaKeywords?: string | null
	CanonicalURL?: string | null
	MetaRobots?: string | null
	StructuredData?: unknown | null
	MetaSocial?: MetaSocial[] | null
}

export interface MetaSocial {
	SocialNetwork?: string | null
	Title?: string | null
	Description?: string | null
	Image?: Image | null
}

export interface NewsArticleCategory {
	documentId: string
	CategoryName?: string | null
	Slug?: string | null
	CategoryTeaserText?: string | null
	FeatureTitle?: string | null
	CategoryDescription?: string | null
	CategoryImage?: Image | null
}

export interface NewsArticle {
	documentId: string
	Headline?: string | null
	SubHeadline?: string | null
	TeaserText?: string | null
	Slug?: string | null
	Author?: string | null
	DateOfPublication?: string | null
	publishedAt?: string | null
	FeaturedArticle?: boolean | null
	Image?: Image | null
	SEO?: SEO | null
	category?: NewsArticleCategory | null
	NewsContentSections?: PageSection[] | null
}
