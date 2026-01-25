'use client'

import { Button, Box, Typography, IconButton, Tooltip } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { DogDataTab } from './dog-detail-modal/dog-data-tab'
import { resolveDogImage } from '@/lib/dog-utils'
import { DogPedigreeTab } from './dog-detail-modal/dog-pedigree-tab'
import { DogOwnerTab } from './dog-detail-modal/dog-owner-tab'
import { DogPersonalWordsTab } from './dog-detail-modal/dog-personal-words-tab'
import { DogImagesTab } from './dog-detail-modal/dog-images-tab'
import { DogPerformanceTab } from './dog-detail-modal/dog-performance-tab'

import type { Dog, HzdSetting } from '@/types'
import { theme } from '@/themes'
import Image from 'next/image'

interface DogDetailViewProps {
    dog: Dog
    strapiBaseUrl?: string | null
    hzdSetting?: HzdSetting | null
    onBack: () => void
}

export function DogDetailView({ dog, strapiBaseUrl, hzdSetting, onBack }: DogDetailViewProps) {
    const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'

    // Helper to render a Section Header with Close Button
    const SectionHeader = ({ title }: { title: string }) => (
        <Box sx={{ borderBottom: '2px solid #e5e7eb', pb: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h5' component='h2'>
                {title}
            </Typography>
            <Tooltip title="Zurück zur Suchliste">
                <IconButton onClick={onBack} size="small" sx={{ color: theme.submitButtonColor }}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        </Box>
    )

    // Determine main image URL
    const mainImageUrl = resolveDogImage(dog, hzdSetting, strapiBaseUrl)

    return (
        <div className='bg-white p-4 md:p-8 animate-in fade-in duration-300'>
            {/* Header Section with Image and Name */}
            <div className='mb-8 flex flex-col items-center text-center'>
                <div className='relative mb-4 w-full max-w-2xl overflow-hidden rounded-lg shadow-lg' style={{ aspectRatio: '4/3' }}>
                    <Image
                        src={mainImageUrl}
                        alt={fullName}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 800px'
                        priority
                        unoptimized
                    />
                </div>
                <h1 className='text-3xl font-bold text-gray-900 md:text-4xl'>{fullName}</h1>
                {dog.givenName && dog.fullKennelName ? (
                    <p className='mt-2 text-xl text-gray-600'>{dog.givenName}</p>
                ) : null}
            </div>



            {/* Content Sections */}
            <div className='mx-auto max-w-4xl space-y-8'>
                {/* 1. Daten */}
                <section>
                    <SectionHeader title="Daten" />
                    <DogDataTab dog={dog} strapiBaseUrl={strapiBaseUrl} hzdSetting={hzdSetting} />
                </section>

                {/* 2. Pedigree */}
                <section>
                    <SectionHeader title="Pedigree" />
                    <DogPedigreeTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
                </section>

                {/* 3. Besitzer */}
                <section>
                    <SectionHeader title="Besitzer" />
                    <DogOwnerTab dog={dog} />
                </section>

                {/* 4. Persönliche Worte */}
                <section>
                    <SectionHeader title="Persönliche Worte" />
                    <DogPersonalWordsTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
                </section>

                {/* 5. Bilder */}
                <section>
                    <SectionHeader title="Bilder" />
                    <DogImagesTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
                </section>

                {/* 6. Leistungen */}
                <section>
                    <SectionHeader title="Leistungen" />
                    <DogPerformanceTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
                </section>

            </div>
        </div >
    )
}
