type HeroHeight = 'small' | 'medium' | 'tall'

const HEIGHT_CLASS: Record<HeroHeight, string> = {
	small: 'h-[clamp(11rem,42vw,300px)] md:h-[350px] lg:h-[400px]',
	medium: 'h-[clamp(13rem,56vw,450px)] md:h-[525px] lg:h-[600px]',
	tall: 'h-[clamp(16rem,70vw,600px)] md:h-[700px] lg:h-[800px]',
}

const MIN_HEIGHT_CLASS: Record<HeroHeight, string> = {
	small: 'min-h-[clamp(11rem,42vw,300px)] md:min-h-[350px] lg:min-h-[400px]',
	medium: 'min-h-[clamp(13rem,56vw,450px)] md:min-h-[525px] lg:min-h-[600px]',
	tall: 'min-h-[clamp(16rem,70vw,600px)] md:min-h-[700px] lg:min-h-[800px]',
}

export function heroHeightClass(height: string | null | undefined): string {
	return HEIGHT_CLASS[normalizeHeroHeight(height)]
}

export function heroMinHeightClass(height: string | null | undefined): string {
	return MIN_HEIGHT_CLASS[normalizeHeroHeight(height)]
}

function normalizeHeroHeight(height: string | null | undefined): HeroHeight {
	if (height === 'small' || height === 'medium' || height === 'tall') {
		return height
	}
	return 'tall'
}
