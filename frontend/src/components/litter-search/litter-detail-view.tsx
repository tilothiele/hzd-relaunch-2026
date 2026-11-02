'use client'

import { Box, Typography, Modal, IconButton } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import Image from 'next/image'
import type { Litter, HzdSetting } from '@/types'
import {
	getPuppyAvailabilityRows,
	PuppyAvailabilityDetail,
} from '@/components/litter-search/puppy-availability'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { formatDayMonthYear } from '@/lib/date-utils'
import { theme } from '@/themes'
import { BackButton } from '@/components/ui/back-button'
import { useState } from 'react'

interface LitterDetailViewProps {
    litter: Litter
    strapiBaseUrl: string
    hzdSetting?: HzdSetting | null
    distance: number | null
    onBack: () => void
    formatDate: (dateString: string | null | undefined) => string
}

interface SectionHeaderProps {
    title: string
    onBack: () => void
}

function SectionHeader({ title, onBack }: SectionHeaderProps) {
    return (
        <Box sx={{ borderBottom: '2px solid #e5e7eb', pb: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
            <BackButton onClick={onBack} />
        </Box>
    )
}

interface DetailRowProps {
    label: string
    value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex items-center border-b border-gray-200 py-3 last:border-0">
            <div className="w-1/3 md:w-1/4 font-semibold text-gray-700">{label}</div>
            <div className="w-2/3 md:w-3/4 text-gray-900">{value}</div>
        </div>
    )
}

const getStatusLabel = (status: Litter['LitterStatus']) => {
    switch (status) {
        case 'Planned': return 'Geplant'
        case 'Manted': return 'Erwartet'
        case 'Littered': return 'Geworfen'
        case 'Closed': return 'Geschlossen'
        default: return status
    }
}

const renderStatusBadge = (status: Litter['LitterStatus']) => {
    const label = getStatusLabel(status)
    let colorClasses = 'bg-gray-100 text-gray-800'

    switch (status) {
        case 'Planned':
            colorClasses = 'bg-blue-100 text-blue-800'
            break
        case 'Manted':
            colorClasses = 'bg-yellow-100 text-yellow-800'
            break
        case 'Littered':
            colorClasses = 'bg-green-100 text-green-800'
            break
        case 'Closed':
            colorClasses = 'bg-gray-200 text-gray-700'
            break
    }

    return (
        <span className={`rounded font-medium uppercase px-2 py-1 text-xs ${colorClasses}`}>
            {label}
        </span>
    )
}

export function LitterDetailView({
    litter,
    strapiBaseUrl,
    hzdSetting,
    distance,
    onBack,
    formatDate,
}: LitterDetailViewProps) {
    const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null)
    const handleZoomClose = () => setZoomImage(null)
    const orderLetter = litter.OrderLetter ?? ''
    const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
    const breederMember = litter.breeder?.Address?.FullName?.trim() ?? ''
    // Telefonnummer aus dem Breeder-Attribut "Phone", Rückfall auf das
    // Adressfeld 2 (Altdaten aus dem CSV-Import).
    const breederPhone = litter.breeder?.Phone?.trim()
        || litter.breeder?.Address?.Address2?.trim()
        || ''
    const breederAddress = [
        litter.breeder?.Address?.Address1,
        litter.breeder?.Address?.Zip,
        litter.breeder?.Address?.City,
    ].filter(Boolean).join(', ')
    const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
    const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName
    const stuntDogNonHzdOriginNote = litter.stuntDog?.NonHzdOriginNote?.trim()

    const renderMotherImage = () => {
        const url = resolveMediaUrl(
            litter.mother?.avatar ||
            (litter.mother?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
                litter.mother?.color === 'B' ? hzdSetting?.DefaultAvatarB :
                    hzdSetting?.DefaultAvatarS),
            strapiBaseUrl
        ) || ''

        return (
            <div className='flex flex-col items-center'>
                <div
                    className='relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-2 cursor-zoom-in group/img'
                    onClick={() => setZoomImage({ url, name: motherName })}
                >
                    <Image
                        src={url}
                        alt="Zuchthündin"
                        fill
                        className='object-cover transition-transform duration-300 group-hover/img:scale-105'
                        unoptimized
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center'>
                        <div className='opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/80 p-1.5 rounded-full shadow-md'>
                            <OpenInNewIcon sx={{ fontSize: 18, color: 'action.active' }} />
                        </div>
                    </div>
                </div>
                <span className="font-semibold text-gray-700 text-sm md:text-base">Zuchthündin: {motherName}</span>
            </div>
        )
    }

    const renderFatherImage = () => {
        const url = resolveMediaUrl(
            litter.stuntDog?.avatar ||
            (litter.stuntDog?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
                litter.stuntDog?.color === 'B' ? hzdSetting?.DefaultAvatarB :
                    hzdSetting?.DefaultAvatarS),
            strapiBaseUrl
        ) || ''
        const name = stuntDogName || 'Unbekannt'
        const fullKennelName = litter.stuntDog?.fullKennelName ?? name

        return (
            <div className='flex flex-col items-center'>
                <div
                    className='relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-2 cursor-zoom-in group/img'
                    onClick={() => setZoomImage({ url, name })}
                >
                    <Image
                        src={url}
                        alt="Vater"
                        fill
                        className='object-cover transition-transform duration-300 group-hover/img:scale-105'
                        unoptimized
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors flex items-center justify-center'>
                        <div className='opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/80 p-1.5 rounded-full shadow-md'>
                            <OpenInNewIcon sx={{ fontSize: 18, color: 'action.active' }} />
                        </div>
                    </div>
                </div>
                <span className="font-semibold text-gray-700 text-sm md:text-base text-center">
                    {fullKennelName}
                </span>
                {stuntDogNonHzdOriginNote ? (
                    <span className="mt-1 text-center text-sm text-gray-600">
                        {stuntDogNonHzdOriginNote}
                    </span>
                ) : null}
            </div>
        )
    }

    const renderPuppyImage = () => (
        <div className='flex flex-col items-center w-full max-w-4xl mx-auto'>
            <div className='relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-2'>
                <Image
                    src={resolveMediaUrl(
                        litter.PuppyImage || hzdSetting?.DefaultLitterAvatar,
                        strapiBaseUrl
                    ) || '/static-images/placeholder/puppies.png'}
                    alt="Welpen"
                    fill
                    className='object-cover'
                    unoptimized
                />
            </div>
            <span className="font-semibold text-gray-700">Welpen</span>
        </div>
    )

    const isLittered = litter.LitterStatus === 'Littered'
    const puppyRows = getPuppyAvailabilityRows(litter)

    return (
        <div className='bg-white p-4 md:p-8 animate-in fade-in duration-300'>
            {/* Header Section */}
            <div className='mb-8 flex flex-col items-center text-center'>
                <h1 className='text-3xl font-bold text-gray-900 md:text-4xl mb-4'>
                    {orderLetter}-Wurf: {kennelName}
                </h1>
                <div className="mb-4">
                    {renderStatusBadge(litter.LitterStatus)}
                </div>


                {/* Images Logic */}
                <div className='w-full max-w-5xl mx-auto'>
                    {isLittered ? (
                        // Case: Littered -> Show Puppy Image at Top
                        <div className='mb-8'>
                            {renderPuppyImage()}
                        </div>
                    ) : (
                        // Case: Not Littered -> Show Parents at Top (2 columns)
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {renderMotherImage()}
                            {renderFatherImage()}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Sections */}
            <div className='mx-auto max-w-4xl space-y-8'>
                {/* 1. Allgemein */}
                <section>
                    <SectionHeader title="Allgemein" onBack={onBack} />
                    <div className="rounded-lg bg-gray-50 px-6 py-2">
                        {litter.LitterStatus === 'Planned' && litter.plannedDateOfBirth && (
                            <DetailRow
                                label="Wurf geplant"
                                value={new Date(litter.plannedDateOfBirth).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                            />
                        )}
                        {litter.LitterStatus === 'Manted' ? (
                            <DetailRow
                                label="Vorauss. Wurfdatum"
                                value={formatDayMonthYear(litter.expectedDateOfBirth)}
                            />
                        ) : litter.LitterStatus !== 'Littered' && litter.expectedDateOfBirth ? (
                            <DetailRow label="Erw. Wurfdatum" value={formatDate(litter.expectedDateOfBirth)} />
                        ) : null}
                        {litter.dateOfBirth && (
                            <DetailRow label="Wurfdatum" value={formatDate(litter.dateOfBirth)} />
                        )}
                        <DetailRow label="Status" value={getStatusLabel(litter.LitterStatus)} />
                        {distance !== null && (
                            <DetailRow label="Entfernung" value={`~${Math.round(distance)} km`} />
                        )}
                    </div>
                </section>

                {/* 2. Züchter */}
                <section>
                    <SectionHeader title="Züchter" onBack={onBack} />
                    <div className="rounded-lg bg-gray-50 px-6 py-2">
                        <DetailRow
                            label="Zwinger"
                            value={
                                litter.breeder?.WebsiteUrl ? (
                                    <a
                                        href={litter.breeder.WebsiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline hover:text-primary-dark transition-colors inline-flex items-center gap-1"
                                        style={{ color: theme.submitButtonColor }}
                                    >
                                        {kennelName}
                                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                                    </a>
                                ) : (
                                    kennelName
                                )
                            }
                        />
                        {breederMember && (
                            <DetailRow label="Name" value={breederMember} />
                        )}
                        {breederAddress && (
                            <DetailRow label="Adresse" value={breederAddress} />
                        )}
                        {breederPhone && (
                            <DetailRow
                                label="Telefon"
                                value={
                                    <a
                                        href={`tel:${breederPhone.replace(/[\s/]/g, '')}`}
                                        className="text-primary hover:underline transition-colors"
                                        style={{ color: theme.submitButtonColor }}
                                    >
                                        {breederPhone}
                                    </a>
                                }
                            />
                        )}
                    </div>
                </section>

                {/* 3. Persönliche Worte / Status */}
                {litter.StatusMessage && (
                    <section>
                        <SectionHeader title="Informationen" onBack={onBack} />
                        <div className='rounded bg-blue-50 p-6'>
                            <p className='text-sm text-blue-900 leading-relaxed font-medium'>{litter.StatusMessage}</p>
                        </div>
                    </section>
                )}

                {/* 3. Welpen Statistik */}
                {isLittered && puppyRows.length > 0 && (
                    <section>
                        <SectionHeader title="Welpen" onBack={onBack} />
                        <div className='mb-6 pt-4'>
                            <p className='mb-2 font-medium text-gray-700'>Verfügbarkeit:</p>
                            <div className='rounded-lg bg-gray-50 px-6 py-2'>
                                <PuppyAvailabilityDetail rows={puppyRows} />
                            </div>
                        </div>
                    </section>
                )}



                {/* Footer Images for 'Littered' status */}
                {isLittered && (
                    <section>
                        <SectionHeader title="Eltern" onBack={onBack} />
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto'>
                            {renderMotherImage()}
                            {renderFatherImage()}
                        </div>
                    </section>
                )}
            </div>

            {/* Image Zoom Modal */}
            <Modal
                open={!!zoomImage}
                onClose={handleZoomClose}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    backdropFilter: 'blur(4px)',
                    bgcolor: 'rgba(0, 0, 0, 0.7)'
                }}
            >
                <Box sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', outline: 'none' }}>
                    <IconButton
                        onClick={handleZoomClose}
                        sx={{
                            position: 'absolute',
                            top: -16,
                            right: -16,
                            bgcolor: theme.footerBackground,
                            color: theme.headerFooterTextColor,
                            '&:hover': {
                                bgcolor: theme.footerBackground,
                                filter: 'brightness(90%)'
                            },
                            boxShadow: 2,
                            zIndex: 1
                        }}
                        size='small'
                    >
                        <CloseIcon fontSize='small' />
                    </IconButton>
                    {zoomImage && (
                        <Box sx={{
                            position: 'relative',
                            width: '90vw',
                            maxWidth: '1000px',
                            aspectRatio: '4/3',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'black',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{ position: 'relative', flexGrow: 1 }}>
                                <Image
                                    src={zoomImage.url}
                                    alt={zoomImage.name}
                                    fill
                                    className='object-contain'
                                    unoptimized
                                    sizes='(max-width: 1000px) 90vw, 1000px'
                                />
                            </Box>
                            <Box sx={{ bgcolor: theme.footerBackground, p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.headerFooterTextColor }}>
                                    {zoomImage.name}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Modal>
        </div>
    )
}
