'use client'

import { Modal, Box, IconButton, Typography, Divider } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Image from 'next/image'
import type { Breeder } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { theme } from '@/themes'
import Link from 'next/link'
import { BreederDogsList } from './breeder-dogs-list'

interface BreederDetailsModalProps {
    breeder: Breeder | null
    open: boolean
    onClose: () => void
    strapiBaseUrl?: string | null
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

export function BreederDetailsModal({ breeder, open, onClose, strapiBaseUrl }: BreederDetailsModalProps) {
    if (!breeder) {
        return null
    }

    const kennelName = breeder.kennelName ?? 'Kein Zwingername bekannt'
    const member = breeder.member
    const avatarUrl = resolveMediaUrl(breeder.avatar, strapiBaseUrl) || '/static-images/placeholder/user-avatar.png'

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby='breeder-details-modal'
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    borderRadius: 2,
                    outline: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header with Close Button */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant='h6' component='h2' sx={{ fontWeight: 600 }}>
                        {kennelName}
                    </Typography>
                    <IconButton onClick={onClose} size='small'>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Scrollable Content */}
                <Box sx={{ p: 0, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '220px' }}>

                    {/* Left Column: Image */}
                    <Box sx={{ width: { xs: '100%', md: '300px' }, height: { xs: '200px', md: 'auto' }, position: 'relative', flexShrink: 0, bgcolor: 'grey.100' }}>
                        <Image
                            src={avatarUrl}
                            alt={kennelName}
                            fill
                            className='object-cover'
                            unoptimized
                            sizes='(max-width: 768px) 100vw, 300px'
                        />
                    </Box>

                    {/* Right Column: Details */}
                    <Box sx={{ p: 3, flexGrow: 1 }}>
                        <div className='space-y-4 text-gray-700'>
                            {breeder.breedingLicenseSince ? (
                                <p>
                                    <strong>Zuchterlaubnis seit:</strong> {formatDate(breeder.breedingLicenseSince)}
                                </p>
                            ) : null}

                            {member?.firstName && member?.lastName ? (
                                <p>
                                    <strong>Züchter:</strong> {member.firstName} {member.lastName}
                                </p>
                            ) : null}

                            {member?.region ? (
                                <p>
                                    <strong>Region:</strong> {getRegionLabel(member.region)}
                                </p>
                            ) : null}

                            <Divider sx={{ my: 2 }} />

                            <h4 className='font-semibold text-gray-900'>Kontakt</h4>

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

                            {breeder.BreedersIntroduction ? (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <h4 className='font-semibold text-gray-900 mb-2'>Über uns</h4>
                                    <div className='prose prose-sm max-w-none text-gray-600' dangerouslySetInnerHTML={{ __html: breeder.BreedersIntroduction }} />
                                </>
                            ) : null}

                            {member?.documentId && (
                                <BreederDogsList
                                    ownerDocumentId={member.documentId}
                                    strapiBaseUrl={strapiBaseUrl}
                                />
                            )}
                        </div>
                    </Box>
                </Box>
            </Box>
        </Modal>
    )
}
