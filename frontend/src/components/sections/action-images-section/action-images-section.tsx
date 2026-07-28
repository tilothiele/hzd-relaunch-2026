import Image from 'next/image'
import Link from 'next/link'
import type { ActionImage, ActionImagesSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface ActionImagesSectionComponentProps {
	section: ActionImagesSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function resolveHref(link: string): {
	href: string
	isExternal: boolean
} {
	const trimmed = link.trim()
	const isExternal = trimmed.startsWith('http://') || trimmed.startsWith('https://')
	return {
		href: trimmed,
		isExternal,
	}
}

export function ActionImagesSectionComponent({
	section,
	strapiBaseUrl,
}: ActionImagesSectionComponentProps) {
	const actionImages = (section.ActionImage ?? []).filter(
		(item): item is ActionImage =>
			Boolean(item?.LinkImage && item.ActionLink?.trim()),
	)

	if (actionImages.length === 0) {
		return null
	}

	return (
		<SectionContainer
			variant='max-width'
			paddingTop='2em'
			paddingBottom='2em'
		>
			<div className='flex flex-wrap items-center justify-center gap-8'>
				{actionImages.map((item, index) => {
					const imageUrl = resolveMediaUrl(item.LinkImage, strapiBaseUrl)
					const actionLink = item.ActionLink?.trim()
					if (!imageUrl || !actionLink) {
						return null
					}

					const title = item.ActionTitle?.trim() || undefined
					const { href, isExternal } = resolveHref(actionLink)
					const key = item.id ?? `${href}-${index}`

					return (
						<Link
							key={key}
							href={href}
							title={title}
							target={isExternal ? '_blank' : undefined}
							rel={isExternal ? 'noopener noreferrer' : undefined}
							className='block w-full max-w-[280px] shrink-0 transition-opacity hover:opacity-90'
						>
							<Image
								src={imageUrl}
								alt={title || item.LinkImage?.alternativeText || 'Aktion'}
								width={item.LinkImage?.width ?? 560}
								height={item.LinkImage?.height ?? 420}
								className='h-auto w-full object-contain'
								unoptimized
								sizes='(max-width: 640px) 100vw, 280px'
							/>
						</Link>
					)
				})}
			</div>
		</SectionContainer>
	)
}
