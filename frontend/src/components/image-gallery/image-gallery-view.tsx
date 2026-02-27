
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import CloseIcon from '@mui/icons-material/Close'

interface MonthGroup {
    monthKey: string
    monthLabel: string
    photographers: {
        photographerName: string
        images: GalleryImage[]
    }[]
}

interface ImageGalleryViewProps {
    heroImage: GalleryImage
    featuredImages: GalleryImage[]
    monthGroups: MonthGroup[]
    strapiUrl: string
}

export function ImageGalleryView({ heroImage, featuredImages, monthGroups, strapiUrl }: ImageGalleryViewProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

    // Handle ESC key to close lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedImage(null)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Prevent scrolling when lightbox is open
    useEffect(() => {
        if (selectedImage) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
    }, [selectedImage])

    const heroImageUrl = heroImage.GalleryImageMedia ? resolveMediaUrl(heroImage.GalleryImageMedia, strapiUrl) : null

    const getPhotographerName = (img: GalleryImage) => {
        const photographer = img.Photographer
        return photographer
            ? `${photographer.firstName || ''} ${photographer.lastName || ''}`.trim() || photographer.username || 'Unbekannt'
            : 'Unbekannt'
    }

    return (
        <>
            {/* Hero Section */}
            <section className="w-full bg-white">
                <div className="relative h-[65vh] min-h-[450px] w-full overflow-hidden bg-gray-900 cursor-pointer" onClick={() => setSelectedImage(heroImage)}>
                    {heroImageUrl && (
                        <Image
                            src={heroImageUrl as string}
                            alt={heroImage.GalleryImageMedia?.alternativeText || 'Hero Image'}
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                            priority
                            unoptimized
                        />
                    )}
                    {/* Stronger Gradient Overlay with H1 */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-12 md:p-20 lg:p-32">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-4xl  text-white font-bold md:text-6xl lg:text-8xl tracking-tight">Bildergalerie</h1>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Images Grid */}
            {featuredImages.length > 0 && (
                <SectionContainer backgroundColor="#f8fafc">
                    <div className="py-16">
                        <div className="mb-12 flex items-center gap-4">
                            <div className="h-12 w-2 bg-primary rounded-full"></div>
                            <h2 className="text-4xl font-bold text-gray-900">Highlights</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                            {featuredImages.map((img) => (
                                <div
                                    key={img.documentId}
                                    className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-2xl cursor-pointer"
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                                        {img.GalleryImageMedia && (
                                            <Image
                                                src={resolveMediaUrl(img.GalleryImageMedia, strapiUrl) as string}
                                                alt={img.GalleryImageMedia.alternativeText || 'Featured Image'}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                unoptimized
                                            />
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <span className="bg-primary/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
                                                Featured
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                                            Eingereicht von {getPhotographerName(img)}
                                        </p>
                                        {img.ImageDescription ? (
                                            <p className="text-xl text-gray-800 font-medium leading-relaxed">{img.ImageDescription}</p>
                                        ) : (
                                            <p className="text-xl italic text-gray-400">Keine Beschreibung</p>
                                        )}
                                        <p className="mt-4 text-xs text-gray-500">
                                            Aufgenommen am {new Date(img.DateOfPicture).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionContainer>
            )}

            {/* Gallery Grid Sections (Standard) */}
            <SectionContainer>
                <div className="py-20">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Archiv</h2>
                        <p className="text-gray-500">Entdecken Sie alle Einsendungen sortiert nach Monaten.</p>
                    </div>

                    {monthGroups.map((month) => (
                        <div key={month.monthKey} className="mb-24 last:mb-0">
                            <h3 className="mb-10 text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <span className="text-primary text-4xl">#</span> {month.monthLabel}
                            </h3>

                            {month.photographers.map((group, pIdx) => (
                                <div key={`${month.monthKey}-${group.photographerName}-${pIdx}`} className="mb-12 last:mb-0">
                                    <h4 className="mb-6 text-lg font-semibold text-gray-600 border-l-4 border-gray-200 pl-4">
                                        Fotograf: {group.photographerName}
                                    </h4>

                                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {group.images.map((img) => (
                                            <div
                                                key={img.documentId}
                                                className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                                                onClick={() => setSelectedImage(img)}
                                            >
                                                <div className="relative aspect-[4/3] w-full overflow-hidden">
                                                    {img.GalleryImageMedia && (
                                                        <Image
                                                            src={resolveMediaUrl(img.GalleryImageMedia, strapiUrl) as string}
                                                            alt={img.GalleryImageMedia.alternativeText || 'Gallery Image'}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                            unoptimized
                                                        />
                                                    )}
                                                </div>
                                                <div className="p-5">
                                                    {img.ImageDescription ? (
                                                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">{img.ImageDescription}</p>
                                                    ) : (
                                                        <p className="text-sm italic text-gray-400">Keine Beschreibung</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </SectionContainer>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 transition-opacity duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute right-8 top-8 z-[10000] rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(null)
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 32 }} />
                    </button>

                    <div className="relative flex h-full w-full max-w-[95vw] items-center justify-center p-4">
                        <div
                            className="relative flex flex-col items-center w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative h-[80vh] w-full max-w-6xl overflow-hidden rounded-lg">
                                {selectedImage.GalleryImageMedia && (
                                    <Image
                                        src={resolveMediaUrl(selectedImage.GalleryImageMedia, strapiUrl) as string}
                                        alt={selectedImage.GalleryImageMedia.alternativeText || 'Lightbox Image'}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                )}
                            </div>
                            <div className="mt-8 text-center text-white max-w-4xl px-4">
                                <p className="text-2xl font-bold tracking-tight">
                                    {getPhotographerName(selectedImage)}
                                </p>
                                {selectedImage.ImageDescription && (
                                    <p className="mt-3 text-xl text-gray-300 font-light leading-relaxed">{selectedImage.ImageDescription}</p>
                                )}
                                <p className="mt-4 text-sm text-gray-500">
                                    Aufgenommen im {new Date(selectedImage.DateOfPicture).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
