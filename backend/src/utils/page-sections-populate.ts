/** Page-Dynamic-Zone (backend page schema) */
export const PAGE_SECTION_BLOCK_COMPONENTS = [
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

type PopulateValue = boolean | Record<string, unknown>

const sectionComponentPopulate = (
	component: (typeof PAGE_SECTION_BLOCK_COMPONENTS)[number],
): PopulateValue => {
	switch (component) {
		case 'blocks.card-section':
			return {
				populate: {
					CardItem: {
						populate: {
							BackgroundImage: true,
							ActionButton: true,
							ColorTheme: true,
						},
					},
				},
			}
		case 'blocks.supplemental-document-group-section':
			return {
				populate: {
					supplemental_document_group: true,
				},
			}
		case 'blocks.hero-section-slide-show':
			return {
				populate: {
					Headline: {
						populate: {
							HeroImage: true,
							ActionButton: true,
						},
					},
				},
			}
		case 'blocks.simple-hero-section':
			return {
				populate: {
					HeroImage: true,
					HeroCta: true,
				},
			}
		case 'blocks.teaser-text-with-image':
			return {
				populate: {
					Image: true,
					ActionButton: true,
				},
			}
		case 'blocks.text-columns-section':
			return {
				populate: {
					TextColumn: {
						populate: {
							ColumnActionButton: true,
							BulletItems: true,
						},
					},
				},
			}
		case 'blocks.image-gallery-section':
			return {
				populate: {
					GalleryImages: true,
				},
			}
		case 'blocks.contact-group-section':
			return {
				populate: {
					ContactGroup: {
						populate: {
							contacts: {
								populate: {
									avatar: true,
								},
							},
						},
					},
				},
			}
		case 'blocks.news-articles-section':
			return {
				populate: {
					news_article_category: {
						fields: ['documentId', 'CategoryName', 'CategoryDescription'],
					},
				},
			}
		default:
			return true
	}
}

/** Dynamic-Zone-Sections: je Block-Typ `on`, ohne globales `populate=*` */
export function buildPageSectionsPopulate(): Record<string, PopulateValue> {
	const on: Record<string, PopulateValue> = {}

	for (const component of PAGE_SECTION_BLOCK_COMPONENTS) {
		on[component] = sectionComponentPopulate(component)
	}

	return { on }
}

export const PAGE_RELATION_POPULATE = {
	populate: {
		Sections: buildPageSectionsPopulate(),
	},
}
