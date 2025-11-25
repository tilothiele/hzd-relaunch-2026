'use client'

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

interface RenderStartpageSectionsParams {
	sections: StartpageSection[] | null | undefined
	strapiBaseUrl: string
	theme: ThemeDefinition
}

interface RenderSectionParams {
	section: StartpageSection
	strapiBaseUrl: string
	theme: ThemeDefinition
	key: string
}

function renderStartpageSection({
	section,
	strapiBaseUrl,
	theme,
	key,
}: RenderSectionParams) {
	switch (section.__typename) {
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
	default:
		return null
	}
}

export function renderStartpageSections({
	sections,
	strapiBaseUrl,
	theme,
}: RenderStartpageSectionsParams) {

	if (!sections?.length) {
		return null
	}

	return sections
		.map((section, index) => {
			const key = `${section.__typename}-${index}`
			return renderStartpageSection({ section, strapiBaseUrl, theme, key })
		})
		.filter((node) => node !== null)
}

