'use client'

import Image from 'next/image'
import type { HeroLayout, SimpleHeroSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '../section-container/section-container'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

import { FullWidthHeroSectionComponent } from './full-width-hero-section'

type NormalizedHeroLayout =
    | 'image-left'
    | 'image-right'
    | 'full-width'
    | 'full-text-below'

function normalizeHeroLayout(layout: HeroLayout | null | undefined): NormalizedHeroLayout {
    switch (layout) {
        case 'Image_left':
        case 'Image left':
            return 'image-left'
        case 'full_width':
        case 'full width':
            return 'full-width'
        case 'full_text_below':
        case 'full text below':
            return 'full-text-below'
        case 'Image_right':
        case 'Image right':
        default:
            return 'image-right'
    }
}

function removeParagraphTags(html: string) {
    return html.replace(/<\/?p(?:\s[^>]*)?>/g, '')
}

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
    const layout = normalizeHeroLayout(section.HeroLayout)
    const headline = section.HeroHeadline
    const teaserText = section.HeroTeaser
    const actionButton = section.HeroCta

    if (layout === 'full-width') {
        return (
            <FullWidthHeroSectionComponent
                section={section}
                strapiBaseUrl={strapiBaseUrl}
                theme={theme}
            />
        )
    }

    if (layout === 'full-text-below') {
        const height = section.Height ?? 'tall'
        const heightClass = {
            small: 'h-[300px] md:h-[350px] lg:h-[400px]',
            medium: 'h-[450px] md:h-[525px] lg:h-[600px]',
            tall: 'h-[600px] md:h-[700px] lg:h-[800px]',
        }[height]
        const teaserHtml = teaserText ? removeParagraphTags(teaserText) : null

        if (!headline && !teaserHtml && !imageUrl) {
            return null
        }

        return (
            <SectionContainer
                variant="full-width"
                id={section.HeroAnchor || undefined}
                backgroundColor="#ffffff"
                paddingTop="0"
                paddingBottom="0"
            >
                <div
                    ref={elementRef}
                    className="hero w-full overflow-hidden"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                    }}
                >
                    {imageUrl ? (
                        <div className={`relative w-full ${heightClass}`}>
                            <Image
                                src={imageUrl}
                                alt={imageAlt}
                                fill
                                className="object-cover object-center"
                                priority
                                unoptimized
                            />
                        </div>
                    ) : null}

                    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-10 text-center md:px-12 md:py-14 lg:py-16">
                        {headline ? (
                            <h1
                                className="mb-0 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                                style={{ color: theme.headlineColor }}
                            >
                                {headline}
                            </h1>
                        ) : null}

                        {teaserHtml ? (
                            <h2
                                className="max-w-3xl text-xl font-normal leading-relaxed md:text-2xl"
                                style={{ color: theme.textColor }}
                                dangerouslySetInnerHTML={{ __html: teaserHtml }}
                            />
                        ) : null}
                    </div>
                </div>
            </SectionContainer>
        )
    }

    if (!headline && !teaserText && !imageUrl) {
        return null
    }

    const isImageLeft = layout === 'image-left'
    const isFullWidth = section.FullWidth ?? false

    const height = section.Height ?? 'tall'
    const minHeightClass = {
        small: 'min-h-[300px] md:min-h-[350px] lg:min-h-[400px]',
        medium: 'min-h-[450px] md:min-h-[525px] lg:min-h-[600px]',
        tall: 'min-h-[600px] md:min-h-[700px] lg:min-h-[800px]',
    }[height]

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
                className={`hero relative flex flex-col overflow-hidden md:flex-row ${minHeightClass}`}
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
                    <div className={`hidden md:block relative w-full md:h-auto md:w-1/2 ${isImageLeft ? 'md:order-1' : 'md:order-2'}`}>
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
