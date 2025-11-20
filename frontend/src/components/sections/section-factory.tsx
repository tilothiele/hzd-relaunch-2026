'use client'

import type { StartpageSection } from '@/types'
import { HeroSectionSlideShowComponent } from './hero-section-slide-show/hero-section-slide-show'
import { CardSectionComponent } from './card-section/card-section'
import { RichTextSectionComponent } from './rich-text-section/rich-text-section'
import { SupplementalDocumentGroupSectionComponent } from './supplemental-document-group-section/supplemental-document-group-section'
import { TeaserTextWithImageSectionComponent } from './teaser-text-with-image-section/teaser-text-with-image-section'
import { TextColumnsSectionComponent } from './text-columns-section/text-columns-section'

interface RenderStartpageSectionsParams {
	sections: StartpageSection[] | null | undefined
	strapiBaseUrl: string
}

interface RenderSectionParams {
	section: StartpageSection
	strapiBaseUrl: string
	key: string
}

function renderStartpageSection({
	section,
	strapiBaseUrl,
	key,
}: RenderSectionParams) {
	switch (section.__typename) {
	case 'ComponentBlocksHeroSectionSlideShow':
		return (
			<HeroSectionSlideShowComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	case 'ComponentBlocksCardSection':
		return (
			<CardSectionComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	case 'ComponentBlocksRichTextSection':
		return (
			<RichTextSectionComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	case 'ComponentBlocksSupplementalDocumentGroupSection':
		return (
			<SupplementalDocumentGroupSectionComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	case 'ComponentBlocksTeaserTextWithImage':
		return (
			<TeaserTextWithImageSectionComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	case 'ComponentBlocksTextColumnsSection':
		return (
			<TextColumnsSectionComponent
				key={key}
				section={section}
				strapiBaseUrl={strapiBaseUrl}
			/>
		)
	default:
		return null
	}
}

export function renderStartpageSections({
	sections,
	strapiBaseUrl,
}: RenderStartpageSectionsParams) {

	if (!sections?.length) {
		return null
	}

	return sections
		.map((section, index) => {
			const key = `${section.__typename}-${index}`
			return renderStartpageSection({ section, strapiBaseUrl, key })
		})
		.filter((node) => node !== null)
}

