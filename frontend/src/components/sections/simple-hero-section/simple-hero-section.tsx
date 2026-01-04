import Image from 'next/image'
import type { SimpleHeroSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '../section-container/section-container'

interface SimpleHeroSectionComponentProps {
    section: SimpleHeroSection
    strapiBaseUrl: string
    theme: ThemeDefinition
    logo?: any
}

export function SimpleHeroSectionComponent({
    section,
    strapiBaseUrl,
    theme,
    logo,
}: SimpleHeroSectionComponentProps) {
    const imageUrl = resolveMediaUrl(section.HeroImage, strapiBaseUrl)
    const imageAlt = section.HeroImage?.alternativeText ?? 'Hero Bild'
    const layout = section.HeroLayout ?? 'Image_right'
    const headline = section.HeroHeadline
    const teaserText = section.HeroTeaser
    const actionButton = section.HeroCta

    if (!headline && !teaserText && !imageUrl) {
        return null
    }

    const isImageLeft = layout === 'Image_left'
    const isFullWidth = section.FullWidth ?? false

    return (
        <SectionContainer
            variant={isFullWidth ? 'full-width' : 'max-width'}
            id={section.HeroAnchor || undefined}
            backgroundColor='#ffffff'
            paddingTop='0'
            paddingBottom='0'
        >
            <div className="relative flex min-h-[500px] flex-col overflow-hidden md:flex-row">
                {/* Content Side */}
                <div
                    className={`z-10 flex flex-1 flex-col justify-end px-6 pb-6 pt-12 md:px-12 md:pb-12 md:pt-24 lg:px-24 lg:pb-24 lg:pt-32 ${isImageLeft ? 'md:order-2' : 'md:order-1'
                        }`}
                >
                    <div className="max-w-xl">
                        {section.ShowLog && logo ? (
                            <div className="mb-8">
                                <Image
                                    src={resolveMediaUrl(logo, strapiBaseUrl) || ''}
                                    alt={logo.alternativeText ?? 'Logo'}
                                    width={200}
                                    height={200}
                                    className="h-[4.5rem] w-auto object-contain md:h-[6rem] lg:h-[7.5rem]"
                                    unoptimized
                                />
                            </div>
                        ) : null}

                        {headline ? (
                            <h1 className="mb-6 text-4xl font-bold leading-tight text-[#1a3673] md:text-5xl lg:text-6xl">
                                {headline}
                            </h1>
                        ) : null}

                        {teaserText ? (
                            <div
                                className="prose prose-lg mb-10 max-w-none text-gray-600"
                                dangerouslySetInnerHTML={{ __html: teaserText }}
                            />
                        ) : null}

                        {actionButton ? (
                            <div className="mb-2">
                                <ActionButton actionButton={actionButton} />
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Image Side */}
                {imageUrl ? (
                    <div className={`relative h-[300px] w-full md:h-auto md:w-1/2 ${isImageLeft ? 'md:order-1' : 'md:order-2'}`}>
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                        {/* Fade Effect - fades the image edge towards the content side */}
                        {section.FadingBorder ? (
                            <div
                                className={`absolute inset-0 hidden md:block ${isImageLeft
                                    ? 'bg-gradient-to-l from-white via-transparent to-transparent'
                                    : 'bg-gradient-to-r from-white via-transparent to-transparent'
                                    }`}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>
        </SectionContainer>
    )
}
