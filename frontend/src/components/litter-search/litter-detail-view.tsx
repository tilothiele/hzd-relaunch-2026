'use client'

import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Image from 'next/image'
import type { Litter, HzdSetting } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { theme } from '@/themes'

interface LitterDetailViewProps {
    litter: Litter
    strapiBaseUrl: string
    hzdSetting?: HzdSetting | null
    distance: number | null
    onBack: () => void
    formatDate: (dateString: string | null | undefined) => string
}

const getStatusLabel = (status: Litter['LitterStatus']) => {
    switch (status) {
        case 'Planned': return 'Geplant'
        case 'Manted': return 'Gedeckt'
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
    const orderLetter = litter.OrderLetter ?? ''
    const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
    const breederMember = ((litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')).trim()
    const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
    const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName

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

    // Helper for 2-column data rows
    const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <div className="flex items-center border-b border-gray-200 py-3 last:border-0">
            <div className="w-1/3 md:w-1/4 font-semibold text-gray-700">{label}</div>
            <div className="w-2/3 md:w-3/4 text-gray-900">{value}</div>
        </div>
    )

    const renderMotherImage = () => (
        <div className='flex flex-col items-center'>
            <div className='relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-2'>
                <Image
                    src={resolveMediaUrl(
                        litter.mother?.avatar ||
                        (litter.mother?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
                            litter.mother?.color === 'B' ? hzdSetting?.DefaultAvatarB :
                                hzdSetting?.DefaultAvatarS),
                        strapiBaseUrl
                    ) || ''}
                    alt="Mutter"
                    fill
                    className='object-cover'
                    unoptimized
                />
            </div>
            <span className="font-semibold text-gray-700">Mutter: {motherName}</span>
        </div>
    )

    const renderFatherImage = () => (
        <div className='flex flex-col items-center'>
            <div className='relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-2'>
                <Image
                    src={resolveMediaUrl(
                        litter.stuntDog?.avatar ||
                        (litter.stuntDog?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
                            litter.stuntDog?.color === 'B' ? hzdSetting?.DefaultAvatarB :
                                hzdSetting?.DefaultAvatarS),
                        strapiBaseUrl
                    ) || ''}
                    alt="Vater"
                    fill
                    className='object-cover'
                    unoptimized
                />
            </div>
            <span className="font-semibold text-gray-700">Vater: {stuntDogName || 'Unbekannt'}</span>
        </div>
    )

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

    return (
        <div className='bg-white p-4 md:p-8 animate-in fade-in duration-300'>
            {/* Header Section */}
            <div className='mb-8 flex flex-col items-center text-center'>
                <h1 className='text-3xl font-bold text-gray-900 md:text-4xl mb-4'>
                    {orderLetter}-Wurf: {kennelName}
                </h1>
                <div className="mb-6">
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
                    <SectionHeader title="Allgemein" />
                    <div className="rounded-lg bg-gray-50 px-6 py-2">
                        {litter.LitterStatus === 'Planned' && litter.plannedDateOfBirth && (
                            <DetailRow
                                label="Gep. Wurfdatum"
                                value={new Date(litter.plannedDateOfBirth).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                            />
                        )}
                        {litter.LitterStatus !== 'Littered' && litter.expectedDateOfBirth && (
                            <DetailRow label="Erw. Wurfdatum" value={formatDate(litter.expectedDateOfBirth)} />
                        )}
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
                    <SectionHeader title="Züchter" />
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
                        {litter.breeder?.member?.zip && litter.breeder?.member?.city && (
                            <DetailRow label="Ort" value={`${litter.breeder.member.zip} ${litter.breeder.member.city}`} />
                        )}
                    </div>
                </section>

                {/* 3. Persönliche Worte / Status */}
                {litter.StatusMessage && (
                    <section>
                        <SectionHeader title="Informationen" />
                        <div className='rounded bg-blue-50 p-6'>
                            <p className='text-sm text-blue-900 leading-relaxed font-medium'>{litter.StatusMessage}</p>
                        </div>
                    </section>
                )}

                {/* 3. Welpen Statistik */}
                {isLittered && (litter.AmountRS || litter.AmountRSM || litter.AmountRB || litter.AmountHS || litter.AmountHSM || litter.AmountHB) && (
                    <section>
                        <SectionHeader title="Welpen" />
                        <div className='mb-6 space-y-2 pt-4'>
                            <div className="flex justify-between items-center mb-2 px-4">
                                <p className='font-medium text-gray-700'>Verfügbarkeit:</p>
                                <div className="flex gap-4 text-[10px] text-gray-500 font-bold">
                                    <span className="w-24 text-center">RUDE (R)</span>
                                    <span className="w-24 text-center">HÜNDIN (H)</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { key: 'S', label: 'Schwarz' },
                                    { key: 'SM', label: 'Schwarzmarken' },
                                    { key: 'B', label: 'Blond' }
                                ].map(({ key, label }) => {
                                    const male = (litter as any)[`AmountR${key}`]
                                    const female = (litter as any)[`AmountH${key}`]
                                    if (!male && !female) return null

                                    return (
                                        <div key={key} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-semibold text-gray-700">{label}:</span>
                                            <div className="flex gap-4 font-mono text-sm">
                                                <span className={`w-24 text-center ${male?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                                                    {male?.Available ?? 0} / {male?.Total ?? 0}
                                                </span>
                                                <span className={`w-24 text-center ${female?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                                                    {female?.Available ?? 0} / {female?.Total ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </section>
                )}



                {/* Footer Images for 'Littered' status */}
                {isLittered && (
                    <section>
                        <SectionHeader title="Eltern" />
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto'>
                            {renderMotherImage()}
                            {renderFatherImage()}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
