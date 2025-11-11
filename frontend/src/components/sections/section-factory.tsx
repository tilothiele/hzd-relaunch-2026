'use client'

import type { StartpageSection } from '@/types'
import { HeroSectionSlideShowComponent } from './hero-section-slide-show/hero-section-slide-show'
import { CardSectionComponent } from './card-section/card-section'

interface RenderStartpageSectionsParams {
	sections: StartpageSection[] | null | undefined
	strapiBaseUrl: string
}

interface RenderSectionParams {
	section: StartpageSection
	strapiBaseUrl: string
	key: string
}

function renderSection({
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
			return renderSection({ section, strapiBaseUrl, key })
		})
		.filter((node) => node !== null)
}

