'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, A11y, Keyboard, Navigation, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import type { Announcement } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn, faLink } from '@fortawesome/free-solid-svg-icons'
import { useMemo } from 'react'

interface AnnouncementSliderProps {
    announcements: Announcement[]
    theme: ThemeDefinition
}

export function AnnouncementSlider({ announcements, theme }: AnnouncementSliderProps) {
    const validAnnouncements = useMemo(() => {
        if (!announcements) return []
        const now = new Date().getTime()
        return announcements.filter(announcement => {
            if (!announcement.createdAt) return true // Fallback if createdAt is missing
            const createdAtTime = new Date(announcement.createdAt).getTime()
            const expirationTime = createdAtTime + (announcement.VisibilityDays * 24 * 60 * 60 * 1000)
            return now < expirationTime
        })
    }, [announcements])

    if (validAnnouncements.length === 0) {
        return null
    }

    return (
        <div
            className="w-full h-8 overflow-hidden relative z-[150] group"
            style={{
                backgroundColor: 'var(--color-hzd-blau)',
                color: 'var(--color-white)'
            }}
        >
            <Swiper
                modules={[Autoplay, A11y, Keyboard, Navigation, EffectFade]}
                slidesPerView={1}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={700}
                loop={validAnnouncements.length > 1}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                navigation={validAnnouncements.length > 1}
                keyboard={{ enabled: true }}
                className="h-full announcement-swiper"
            >
                {validAnnouncements.map((announcement) => (
                    <SwiperSlide key={announcement.documentId}>
                        <div className="flex items-center justify-center h-full px-12 gap-2 text-xs md:text-sm font-medium">
                            <FontAwesomeIcon icon={faBullhorn} style={{ color: theme.buttonHoverColor }} />
                            {announcement.LinkUrl ? (
                                <Link
                                    href={announcement.LinkUrl}
                                    className="hover:underline flex items-center gap-1.5"
                                    target={announcement.LinkUrl.startsWith('http') ? '_blank' : undefined}
                                    rel={announcement.LinkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                                >
                                    <span>{announcement.AnnouncementContent}</span>
                                    <FontAwesomeIcon icon={faLink} className="text-[10px] opacity-70" />
                                </Link>
                            ) : (
                                <span>{announcement.AnnouncementContent}</span>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx global>{`
                .announcement-swiper .swiper-button-next,
                .announcement-swiper .swiper-button-prev {
                    color: white !important;
                    transform: scale(0.35);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .group:hover .announcement-swiper .swiper-button-next,
                .group:hover .announcement-swiper .swiper-button-prev {
                    opacity: 0.6;
                }
                .announcement-swiper .swiper-button-next:hover,
                .announcement-swiper .swiper-button-prev:hover {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    )
}
