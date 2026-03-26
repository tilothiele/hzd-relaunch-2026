'use client'

import { Box, Typography, Divider } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Image from 'next/image'
import type { Breeder, HzdSetting } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { theme } from '@/themes'
import { BreederDogsList } from './breeder-dogs-list'
import { BackButton } from '@/components/ui/back-button'

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
    const kennelName = breeder.kennelName ?? 'Kein Zwingername bekannt'
    const member = breeder.member
    const ownerMemberNames = (breeder.owner_members ?? [])
        .map((om) => {
            return [om.firstName, om.lastName].filter(Boolean).join(' ').trim()
        })
        .filter(Boolean)
    const avatarUrl = resolveMediaUrl(
        breeder.avatar || hzdSetting?.DefaultBreederAvatar,
        strapiBaseUrl
    ) || '/static-images/placeholder/user-avatar.png'

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
                    {breeder.WebsiteUrl ? (
                        <a
                            href={breeder.WebsiteUrl}
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
                        {breeder.breedingLicenseSince ? (
                            <p>
                                <strong>Zuchterlaubnis seit:</strong> {formatDate(breeder.breedingLicenseSince)}
                            </p>
                        ) : null}

                        {ownerMemberNames.length > 0 ? (
                            <div>
                                <strong>Züchter:</strong>
                                {ownerMemberNames.map((fullName, index) => (
                                    <div key={`${fullName}-${index}`}>
                                        {fullName}
                                    </div>
                                ))}
                            </div>
                        ) : (member?.firstName && member?.lastName ? (
                            <p>
                                <strong>Züchter:</strong> {member.firstName} {member.lastName}
                            </p>
                        ) : null)}

                        {member?.region ? (
                            <p>
                                <strong>Region:</strong> {getRegionLabel(member.region)}
                            </p>
                        ) : null}

                        {member?.phone ? (
                            <p>
                                <strong>Telefon:</strong> {member.phone}
                            </p>
                        ) : null}

                        {member?.email ? (
                            <p>
                                <strong>E-Mail:</strong> <a href={`mailto:${member.email}`} className='text-submit-button hover:underline' style={{ color: theme.submitButtonColor }}>{member.email}</a>
                            </p>
                        ) : null}

                        {member?.address1 || member?.address2 ? (
                            <p>
                                <strong>Adresse:</strong>{' '}
                                {[member.address1, member.address2].filter(Boolean).join(', ')}
                            </p>
                        ) : null}

                        {member?.zip || member?.countryCode ? (
                            <p>
                                <strong>PLZ / Land:</strong>{' '}
                                {[member.zip, member.countryCode].filter(Boolean).join(' / ')}
                            </p>
                        ) : null}

                        {breeder.WebsiteUrl ? (
                            <p>
                                <strong>Webseite:</strong>{' '}
                                <a
                                    href={breeder.WebsiteUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-submit-button hover:underline'
                                    style={{ color: theme.submitButtonColor }}
                                >
                                    {breeder.WebsiteUrl}
                                </a>
                            </p>
                        ) : null}
                    </div>
                </section>

                {/* Introduction Section */}
                {breeder.BreedersIntroduction ? (
                    <section>
                        <SectionHeader title="Über uns" />
                        <div className='prose prose-lg max-w-none text-gray-600 bg-white p-6 border border-gray-100 rounded-lg shadow-sm' dangerouslySetInnerHTML={{ __html: breeder.BreedersIntroduction }} />
                    </section>
                ) : null}

                {/* Dogs List Section */}
                {breeder.owner_members && breeder.owner_members.length > 0 && breeder.owner_members[0].documentId && (
                    <section>
                        <SectionHeader title="Zuchthunde" />
                        <Box sx={{ p: 2, bg: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.100', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                            <BreederDogsList
                                ownerDocumentId={breeder.owner_members[0].documentId}
                                strapiBaseUrl={strapiBaseUrl}
                                hzdSetting={hzdSetting}
                            />
                        </Box>
                    </section>
                )}

                {/* Final Back Link */}
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                    <BackButton onClick={onBack} />
                </Box>
            </div>
        </div>
    )
}
