'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, Divider } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Image from 'next/image'
import type { Breeder, Dog, HzdSetting } from '@/types'
import { resolveBreederContact } from '@/lib/breeder-display-utils'
import { getBreederByDocumentId } from '@/lib/strapi/api'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { theme } from '@/themes'
import { BreederDogsList } from './breeder-dogs-list'
import { BackButton } from '@/components/ui/back-button'
import { DogDetailView } from '@/components/dog-search/dog-detail-view'

interface BreederDetailViewProps {
    breeder: Breeder
    strapiBaseUrl?: string | null
    hzdSetting?: HzdSetting | null
    onBack: () => void
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return '-'
    }

    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
    } catch {
        return dateString
    }
}

function getRegionLabel(region: string | null | undefined): string {
    if (!region) {
        return '-'
    }
    return region
}

export function BreederDetailView({ breeder, strapiBaseUrl, hzdSetting, onBack }: BreederDetailViewProps) {
    const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
    const [breederDetails, setBreederDetails] = useState<Breeder>(breeder)
    const kennelName = breederDetails.kennelName ?? 'Kein Zwingername bekannt'
    const contact = resolveBreederContact(breederDetails)

    useEffect(() => {
        setBreederDetails(breeder)
    }, [breeder])

    useEffect(() => {
        if (!breeder.documentId) {
            return
        }

        let cancelled = false

        void getBreederByDocumentId(breeder.documentId)
            .then((freshBreeder) => {
                if (!cancelled && freshBreeder) {
                    setBreederDetails(freshBreeder)
                }
            })
            .catch(() => {
                // Liste bleibt als Fallback sichtbar
            })

        return () => {
            cancelled = true
        }
    }, [breeder.documentId])
    const avatarUrl = resolveMediaUrl(
        breederDetails.avatar || hzdSetting?.DefaultBreederAvatar,
        strapiBaseUrl
    ) || '/static-images/placeholder/user-avatar.png'

    if (selectedDog) {
        return (
            <DogDetailView
                dog={selectedDog}
                strapiBaseUrl={strapiBaseUrl}
                hzdSetting={hzdSetting}
                onBack={() => setSelectedDog(null)}
                backButtonLabel='Zurück zum Züchter'
            />
        )
    }

    // Helper to render a Section Header with Back Button
    const SectionHeader = ({ title }: { title: string }) => (
        <Box sx={{ borderBottom: '2px solid #e5e7eb', pb: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
            <BackButton onClick={onBack} />
        </Box>
    )

    return (
        <div className='bg-white p-4 md:p-8 animate-in fade-in duration-300'>
            {/* Header Section with Avatar and Kennel Name */}
            <div className='mb-8 flex flex-col items-center text-center'>
                <div className='relative mb-6 overflow-hidden rounded-lg shadow-xl border-4 border-white' style={{ width: '520px', height: '390px', maxWidth: '100%' }}>
                    <Image
                        src={avatarUrl}
                        alt={kennelName}
                        fill
                        className='object-cover'
                        unoptimized
                        sizes='(max-width: 520px) 100vw, 520px'
                        priority
                    />
                </div>
                <h1 className='text-3xl font-bold text-gray-900 md:text-4xl'>
                    {breederDetails.WebsiteUrl ? (
                        <a
                            href={breederDetails.WebsiteUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:underline inline-flex items-center gap-2 transition-colors'
                            style={{ color: theme.submitButtonColor, textDecoration: 'none' }}
                        >
                            {kennelName}
                            <OpenInNewIcon sx={{ fontSize: 24 }} />
                        </a>
                    ) : (
                        kennelName
                    )}
                </h1>
            </div>

            <div className='mx-auto max-w-4xl space-y-12'>
                {/* Breeder Details Section */}
                <section>
                    <SectionHeader title="Züchter Details" />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 bg-gray-50 p-6 rounded-lg'>
                        {breederDetails.breedingLicenseSince ? (
                            <p>
                                <strong>Zuchterlaubnis seit:</strong> {formatDate(breederDetails.breedingLicenseSince)}
                            </p>
                        ) : null}

						{contact.ownerDisplayName ? (
							<p>
								<strong>Züchter:</strong> {contact.ownerDisplayName}
							</p>
						) : null}

                        {contact.region ? (
                            <p>
                                <strong>Region:</strong> {getRegionLabel(contact.region)}
                            </p>
                        ) : null}

                        {contact.phone ? (
                            <p>
                                <strong>Telefon:</strong> {contact.phone}
                            </p>
                        ) : null}

                        {contact.email ? (
                            <p>
                                <strong>E-Mail:</strong> <a href={`mailto:${contact.email}`} className='text-submit-button hover:underline' style={{ color: theme.submitButtonColor }}>{contact.email}</a>
                            </p>
                        ) : null}

                        {contact.address1 || contact.address2 ? (
                            <p>
                                <strong>Adresse:</strong>{' '}
                                {[contact.address1, contact.address2].filter(Boolean).join(', ')}
                            </p>
                        ) : null}

                        {contact.zip || contact.city || contact.countryCode ? (
                            <p>
                                <strong>PLZ / Ort:</strong>{' '}
                                {[contact.zip, contact.city].filter(Boolean).join(' ')}
                                {contact.countryCode ? ` / ${contact.countryCode}` : ''}
                            </p>
                        ) : null}

                        {breederDetails.WebsiteUrl ? (
                            <p>
                                <strong>Webseite:</strong>{' '}
                                <a
                                    href={breederDetails.WebsiteUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-submit-button hover:underline'
                                    style={{ color: theme.submitButtonColor }}
                                >
                                    {breederDetails.WebsiteUrl}
                                </a>
                            </p>
                        ) : null}
                    </div>
                </section>

                {/* Introduction Section */}
                {breederDetails.BreedersIntroduction ? (
                    <section>
                        <SectionHeader title="Über uns" />
                        <div className='prose prose-lg max-w-none text-gray-600 bg-white p-6 border border-gray-100 rounded-lg shadow-sm' dangerouslySetInnerHTML={{ __html: breederDetails.BreedersIntroduction }} />
                    </section>
                ) : null}

                {/* Zuchthündinnen */}
                <section>
                    <SectionHeader title="Zuchthündinnen" />
                    <Box sx={{ p: 2, bg: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.100', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                        <BreederDogsList
                            key={`${breederDetails.documentId}:${contact.ownerCIds.join(',')}`}
                            ownerCIds={contact.ownerCIds}
                            strapiBaseUrl={strapiBaseUrl}
                            hzdSetting={hzdSetting}
                            hasNoDogsAvailabe={breederDetails.HasNoDogsAvailabe}
                            onDogSelect={setSelectedDog}
                        />
                    </Box>
                </section>

                {/* Final Back Link */}
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                    <BackButton onClick={onBack} />
                </Box>
            </div>
        </div>
    )
}
