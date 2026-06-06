/**
 * Strapi 5 REST populate parameters.
 * Media fields (single/multiple) require `true`, not `*` — otherwise:
 * "Invalid key related at {field}.related"
 *
 * Dynamic Zones: `populate[Sections][populate]=*` darf NICHT mit
 * `populate[Sections][on][...]` kombiniert werden (liefert sonst leere Sections).
 * Stattdessen für jeden Block-Typ ein eigenes `on` (siehe SECTION_BLOCK_COMPONENTS).
 */

/** Alle Block-Komponenten der Page-Dynamic-Zone (backend page schema) */
const SECTION_BLOCK_COMPONENTS = [
	'blocks.hero-section-slide-show',
	'blocks.card-section',
	'blocks.rich-text-section',
	'blocks.supplemental-document-group-section',
	'blocks.teaser-text-with-image',
	'blocks.text-columns-section',
	'blocks.image-gallery-section',
	'blocks.simple-cta-section',
	'blocks.news-articles-section',
	'blocks.contact-group-section',
	'blocks.contact-mailer-section',
	'blocks.simple-hero-section',
	'blocks.document-bundle-section',
	'blocks.table-of-content-section',
	'blocks.champions-section',
	'blocks.passed-dogs-section',
] as const

/** Dynamic Zone in news-article (schema) */
const NEWS_ARTICLE_SECTION_COMPONENTS = [
	'blocks.text-columns-section',
	'blocks.teaser-text-with-image',
	'blocks.supplemental-document-group-section',
	'blocks.simple-cta-section',
	'blocks.rich-text-section',
	'blocks.image-gallery-section',
	'blocks.contact-group-section',
	'blocks.card-section',
] as const

/** Dynamic Zone in news-article-category (schema) */
const NEWS_CATEGORY_SECTION_COMPONENTS = [
	'blocks.simple-hero-section',
	'blocks.text-columns-section',
] as const

/** Dynamic-Zone-Sections: je Block-Typ `on`, ohne globales `populate=*` */
function appendSectionsDeepPopulate(
	params: URLSearchParams,
	sectionsPath: string,
	components: readonly string[] = SECTION_BLOCK_COMPONENTS,
): void {
	const on = `${sectionsPath}[on]`

	for (const component of components) {
		const base = `${on}[${component}][populate]`

		switch (component) {
			case 'blocks.card-section':
				params.set(`${base}[CardItem][populate][BackgroundImage]`, 'true')
				params.set(`${base}[CardItem][populate][ActionButton]`, '*')
				params.set(`${base}[CardItem][populate][ColorTheme]`, '*')
				break
			case 'blocks.supplemental-document-group-section':
				// Dokumente werden in enrich-supplemental-sections nachgeladen
				params.set(`${base}[supplemental_document_group]`, 'true')
				break
			case 'blocks.hero-section-slide-show':
				params.set(`${base}[Headline][populate][HeroImage]`, 'true')
				params.set(`${base}[Headline][populate][ActionButton]`, '*')
				break
			case 'blocks.simple-hero-section':
				params.set(`${base}[HeroImage]`, 'true')
				params.set(`${base}[HeroCta]`, '*')
				break
			case 'blocks.teaser-text-with-image':
				params.set(`${base}[Image]`, 'true')
				params.set(`${base}[ActionButton]`, '*')
				break
			case 'blocks.text-columns-section':
				params.set(`${base}[TextColumn][populate][ColumnActionButton]`, '*')
				params.set(`${base}[TextColumn][populate][BulletItems]`, '*')
				break
			case 'blocks.image-gallery-section':
				params.set(`${base}[GalleryImages]`, 'true')
				break
			case 'blocks.contact-group-section':
				params.set(`${base}[ContactGroup][populate][contacts][populate][avatar]`, 'true')
				break
			default:
				params.set(base, 'true')
				break
		}
	}
}

function buildPageSectionsPopulate(): URLSearchParams {
	const params = new URLSearchParams()
	appendSectionsDeepPopulate(params, 'populate[Sections]')
	params.set('populate[Restriction]', '*')
	params.set('populate[ColorTheme]', '*')
	return params
}

export const POPULATE_PAGE_SECTIONS = buildPageSectionsPopulate()

export const POPULATE_FORM = new URLSearchParams({
	'populate[FormFields][populate]': '*',
	'populate[EventAdmin][fields][0]': 'documentId',
	'populate[EventAdmin][fields][1]': 'firstName',
	'populate[EventAdmin][fields][2]': 'lastName',
})

export const POPULATE_CONTACT = new URLSearchParams({
	'populate[avatar]': 'true',
	'populate[member][fields][0]': 'documentId',
	'populate[member][fields][1]': 'firstName',
	'populate[member][fields][2]': 'lastName',
})

/** member/owner_members sind users-permissions.user — `=*` triggert Invalid key role */
export const POPULATE_BREEDER_SEARCH = new URLSearchParams({
	'populate[member][fields][0]': 'documentId',
	'populate[member][fields][1]': 'cId',
	'populate[member][fields][2]': 'firstName',
	'populate[member][fields][3]': 'lastName',
	'populate[member][fields][4]': 'region',
	'populate[member][fields][5]': 'phone',
	'populate[member][fields][6]': 'email',
	'populate[member][fields][7]': 'city',
	'populate[member][fields][8]': 'address1',
	'populate[member][fields][9]': 'address2',
	'populate[member][fields][10]': 'zip',
	'populate[member][fields][11]': 'countryCode',
	'populate[member][fields][12]': 'locationLat',
	'populate[member][fields][13]': 'locationLng',
	'populate[member][fields][14]': 'username',
	'populate[avatar]': 'true',
	'populate[Address]': 'true',
	'populate[owner_members][fields][0]': 'documentId',
	'populate[owner_members][fields][1]': 'cId',
	'populate[owner_members][fields][2]': 'firstName',
	'populate[owner_members][fields][3]': 'lastName',
	'populate[owner_members][fields][4]': 'region',
	'populate[owner_members][fields][5]': 'phone',
	'populate[owner_members][fields][6]': 'email',
	'populate[owner_members][fields][7]': 'city',
	'populate[owner_members][fields][8]': 'address1',
	'populate[owner_members][fields][9]': 'address2',
	'populate[owner_members][fields][10]': 'zip',
	'populate[owner_members][fields][11]': 'countryCode',
	'populate[owner_members][fields][12]': 'locationLat',
	'populate[owner_members][fields][13]': 'locationLng',
})

export const POPULATE_PASSED_DOG = new URLSearchParams({
	'populate[Avatar]': 'true',
	'populate[hzd_plugin_dog][fields][0]': 'documentId',
	'populate[hzd_plugin_dog][fields][1]': 'fullKennelName',
})

function buildNewsArticlePopulate(): URLSearchParams {
	const params = new URLSearchParams({
		'populate[Image]': 'true',
		'populate[category]': 'true',
		'populate[news_article_tags]': 'true',
		'populate[SEO][populate][author]': 'true',
	})
	appendSectionsDeepPopulate(
		params,
		'populate[NewsContentSections]',
		NEWS_ARTICLE_SECTION_COMPONENTS,
	)
	return params
}

export const POPULATE_NEWS_ARTICLE = buildNewsArticlePopulate()

export function buildNewsArticleCategoryPopulate(): URLSearchParams {
	const params = new URLSearchParams()
	appendSectionsDeepPopulate(
		params,
		'populate[ContentSections]',
		NEWS_CATEGORY_SECTION_COMPONENTS,
	)
	return params
}

export const POPULATE_NEWS_ARTICLE_CATEGORY = buildNewsArticleCategoryPopulate()

export const POPULATE_PHOTOBOX_COLLECTION = new URLSearchParams({
	'populate[photogapher][fields][0]': 'documentId',
	'populate[photobox_images][populate][Thumbnail]': 'true',
})

export const POPULATE_SUPPLEMENTAL_DOCUMENT = new URLSearchParams({
	'populate[DownloadDocument]': 'true',
})

export const POPULATE_CALENDAR_ENTRY = new URLSearchParams({
	'populate[calendar]': 'true',
	'populate[form][fields][0]': 'documentId',
	'populate[CalendarDocument][populate][MediaFile]': 'true',
})
