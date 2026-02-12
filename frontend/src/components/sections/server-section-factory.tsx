import type { StartpageSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { HeroSectionSlideShowComponent } from './hero-section-slide-show/hero-section-slide-show'
import { CardSectionComponent } from './card-section/card-section'
import { RichTextSectionComponent } from './rich-text-section/rich-text-section'
import { SupplementalDocumentGroupSectionComponent } from './supplemental-document-group-section/supplemental-document-group-section'
import { TeaserTextWithImageSectionComponent } from './teaser-text-with-image-section/teaser-text-with-image-section'
import { TextColumnsSectionComponent } from './text-columns-section/text-columns-section'
import { ImageGallerySectionComponent } from './image-gallery-section/image-gallery-section'
import { SimpleCtaSectionComponent } from './simple-cta-section/simple-cta-section'
import { ContactGroupSectionComponent } from './contact-group-section/contact-group-section'
import { NewsArticlesSectionComponent } from './news-articles-section/news-articles-section'
import { ContactMailerSectionComponent } from './contact-mailer-section/contact-mailer-section'
import { SimpleHeroSectionComponent } from './simple-hero-section/simple-hero-section'
import { DocumentBundleSectionComponent } from './document-bundle-section/document-bundle-section'
import { TableOfContentSectionComponent } from './table-of-content-section/table-of-content-section'

interface RenderSectionParams {
	section: StartpageSection
	strapiBaseUrl: string
	theme: ThemeDefinition
	key: string
	logo?: any // Add logo prop
}

function renderSection({
	section,
	strapiBaseUrl,
	theme,
	key,
	logo,
}: RenderSectionParams) {
	switch (section.__typename) {
		case 'ComponentBlocksNewsArticlesSection':
			return (
				<NewsArticlesSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksHeroSectionSlideShow':
			return (
				<HeroSectionSlideShowComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksCardSection':
			return (
				<CardSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksRichTextSection':
			return (
				<RichTextSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksSupplementalDocumentGroupSection':
			return (
				<SupplementalDocumentGroupSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksTeaserTextWithImage':
			return (
				<TeaserTextWithImageSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksTextColumnsSection':
			return (
				<TextColumnsSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksImageGallerySection':
			return (
				<ImageGallerySectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksSimpleCtaSection':
			return (
				<SimpleCtaSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksContactGroupSection':
			return (
				<ContactGroupSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksContactMailerSection':
			return (
				<ContactMailerSectionComponent
					key={key}
					section={section as any}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksSimpleHeroSection':
			return (
				<SimpleHeroSectionComponent
					key={key}
					section={section as any}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
					logo={logo}
				/>
			)
		case 'ComponentBlocksDocumentBundleSection':
			return (
				<DocumentBundleSectionComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksTableOfContentSection':
			return (
				<TableOfContentSectionComponent
					key={key}
					section={section as any}
					theme={theme}
				/>
			)
		default:
			return null
	}
}

export function renderServerSections({
	sections,
	strapiBaseUrl,
	theme,
	logo,
}: {
	sections: StartpageSection[] | null | undefined
	strapiBaseUrl: string
	theme: ThemeDefinition
	logo?: any // Add logo prop
}) {
	if (!sections?.length) {
		return null
	}

	return sections
		.map((section, index) => {
			const key = `${section.__typename}-${index}`
			return renderSection({ section, strapiBaseUrl, theme, key, logo })
		})
		.filter((node) => node !== null)
}
