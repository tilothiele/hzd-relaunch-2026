'use client'

import Image from 'next/image'
import type { SimpleHeroSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '../section-container/section-container'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

import { FullWidthHeroSectionComponent } from './full-width-hero-section'

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
    const { elementRef, isVisible } = useScrollAnimation({
        threshold: 0.1,
        triggerOnce: false,
    })

    const imageUrl = resolveMediaUrl(section.HeroImage, strapiBaseUrl)
    const imageAlt = section.HeroImage?.alternativeText ?? 'Hero Bild'
    const layout = section.HeroLayout ?? 'Image_right'

    if (layout === 'full_width') {
        return (
            <FullWidthHeroSectionComponent
                section={section}
                strapiBaseUrl={strapiBaseUrl}
                theme={theme}
            />
        )
    }

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
            <div
                ref={elementRef}
                className="hero relative flex min-h-[500px] flex-col overflow-hidden md:flex-row"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                }}
            >
                {/* Logo - precisely 2rem from top */}
                {section.ShowLog && logo ? (
                    <div
                        className={`absolute top-[2rem] z-20 flex w-full px-6 md:w-1/2 md:px-12 lg:px-24 ${isImageLeft ? 'md:right-0' : 'md:left-0'
                            }`}
                    >
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
                {/* Content Side */}
                <div
                    className={`z-10 flex flex-1 flex-col justify-end px-6 pb-8 pt-12 md:px-12 md:pt-24 lg:px-24 lg:pt-32 ${isImageLeft ? 'md:order-2' : 'md:order-1'
                        }`}
                >
                    <div className="max-w-xl">

                        {headline ? (
                            <h1 className="mb-6 text-4xl line-height-1.1 font-bold leading-tight md:text-5xl lg:text-6xl" style={{ color: theme.headlineColor }}>
                                {headline}
                            </h1>
                        ) : null}

                        {teaserText ? (
                            <div
                                className="prose prose-lg mb-10 max-w-none text-gray-600"
                            >
                                <p
                                    dangerouslySetInnerHTML={{ __html: teaserText }}
                                ></p>
                            </div>
                        ) : null}

                        {actionButton ? (
                            <div>
                                <ActionButton actionButton={actionButton} theme={theme} />
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
