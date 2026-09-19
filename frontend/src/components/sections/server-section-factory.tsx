import type { Image, StartpageSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { HeroSectionSlideShowComponent } from './hero-section-slide-show/hero-section-slide-show'
import { CardSectionComponent } from './card-section/card-section'
import { RichTextSectionComponent } from './rich-text-section/rich-text-section'
import { SupplementalDocumentGroupSectionComponent } from './supplemental-document-group-section/supplemental-document-group-section'
import { TeaserTextWithImageSectionComponent } from './teaser-text-with-image-section/teaser-text-with-image-section'
import { TextColumnsSectionComponent } from './text-columns-section/text-columns-section'
import { ImageGallerySectionComponent } from './image-gallery-section/image-gallery-section'
import { DetailedImageGallerySectionComponent } from './detailed-image-gallery-section/detailed-image-gallery-section'
import { SimpleCtaSectionComponent } from './simple-cta-section/simple-cta-section'
import { ActionImagesSectionComponent } from './action-images-section/action-images-section'
import { ContactGroupSectionComponent } from './contact-group-section/contact-group-section'
import { NewsArticlesSectionComponent } from './news-articles-section/news-articles-section'
import { ContactMailerSectionComponent } from './contact-mailer-section/contact-mailer-section'
import { SimpleHeroSectionComponent } from './simple-hero-section/simple-hero-section'
import { DocumentBundleSectionComponent } from './document-bundle-section/document-bundle-section'
import { TableOfContentSectionComponent } from './table-of-content-section/table-of-content-section'
import { ChampionsSectionComponent } from './champions-section/champions-section'
import { PassedDogsSectionComponent } from './passed-dogs-section/passed-dogs-section'
import { BlackBoardSectionServerComponent } from './black-board-section/black-board-section-server'
import { FormSectionServerComponent } from './form-section/form-section-server'

interface RenderSectionParams {
	section: StartpageSection
	strapiBaseUrl: string
	theme: ThemeDefinition
	key: string
	logo?: any // Add logo prop
	hzdSetting?: any // Add hzdSetting prop
	privacyPolicy?: Image | null
}

function renderSection({
	section,
	strapiBaseUrl,
	theme,
	key,
	logo,
	hzdSetting,
	privacyPolicy,
}: RenderSectionParams) {
	//console.log('Server Factory Rendering:', section.__typename)
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
		case 'ComponentBlocksDetailedImageGallerySection':
			return (
				<DetailedImageGallerySectionComponent
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
		case 'ComponentBlocksActionImagesSection':
			return (
				<ActionImagesSectionComponent
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
		case 'ComponentBlocksChampionsSection':
			return (
				<ChampionsSectionComponent
					key={key}
					section={section as any}
					theme={theme}
					hzdSetting={hzdSetting}
				/>
			)
		case 'ComponentBlocksPassedDogsSection':
			return (
				<PassedDogsSectionComponent
					key={key}
					section={section as any}
					theme={theme}
				/>
			)
		case 'ComponentBlocksBlackBoardSection':
			return (
				<BlackBoardSectionServerComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)
		case 'ComponentBlocksFormSection':
			return (
				<FormSectionServerComponent
					key={key}
					section={section}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
					privacyPolicy={privacyPolicy}
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
	hzdSetting,
	privacyPolicy,
}: {
	sections: StartpageSection[] | null | undefined
	strapiBaseUrl: string
	theme: ThemeDefinition
	logo?: any // Add logo prop
	hzdSetting?: any // Add hzdSetting prop
	privacyPolicy?: Image | null
}) {
	if (!sections?.length) {
		return null
	}

	return sections
		.map((section, index) => {
			const key = `${section.__typename}-${index}`
			return renderSection({
				section,
				strapiBaseUrl,
				theme,
				key,
				logo,
				hzdSetting,
				privacyPolicy,
			})
		})
		.filter((node) => node !== null)
}
