'use client'

import Image from 'next/image'
import type { SimpleHeroSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '../section-container/section-container'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface FullWidthHeroSectionComponentProps {
    section: SimpleHeroSection
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function FullWidthHeroSectionComponent({
    section,
    strapiBaseUrl,
    theme,
}: FullWidthHeroSectionComponentProps) {
    const { elementRef, isVisible } = useScrollAnimation({
        threshold: 0.1,
        triggerOnce: false,
    })

    const imageUrl = resolveMediaUrl(section.HeroImage, strapiBaseUrl)
    const imageAlt = section.HeroImage?.alternativeText ?? 'Hero Bild'
    const headline = section.HeroHeadline
    const teaserText = section.HeroTeaser
    const actionButton = section.HeroCta

    if (!imageUrl) {
        return null
    }

    const height = section.Height ?? 'tall'
    const heightClass = {
        small: 'h-[300px] md:h-[350px] lg:h-[400px]',
        medium: 'h-[450px] md:h-[525px] lg:h-[600px]',
        tall: 'h-[600px] md:h-[700px] lg:h-[800px]',
    }[height]

    return (
        <SectionContainer
            variant="full-width"
            id={section.HeroAnchor || undefined}
            paddingTop="0"
            paddingBottom="0"
        >
            <div
                ref={elementRef}
                className={`hero relative flex w-full flex-col justify-end overflow-hidden ${heightClass}`}
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                }}
            >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                    />
                </div>

                {/* Backdrop Gradient: Transparent top -> Dark bottom */}
                <div
                    className="absolute inset-0 z-10"
                    style={{
                        background: 'linear-gradient(to top, var(--color-backdrop-gradient) 0%, transparent 50%)'
                    }}
                />

                {/* Content */}
                <div className="container relative z-20 mx-auto px-6 pb-11 md:px-12 lg:pb-20">
                    <div className="mx-auto flex max-w-4xl flex-col items-center text-center" style={{ color: 'var(--color-backdrop-gradient-text)' }}>
                        {headline ? (
                            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-7xl" style={{ color: 'inherit' }}>
                                {headline}
                            </h1>
                        ) : null}

                        {teaserText ? (
                            <p
                                className="mb-10 max-w-none"
                                style={{ color: 'inherit' }}>
                                {teaserText}
                            </p>
                        ) : null}

                        {actionButton ? (
                            <div>
                                <ActionButton actionButton={actionButton} theme={theme} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </SectionContainer>
    )
}
