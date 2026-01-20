'use client'

import { useEffect } from 'react'
import { IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Image from 'next/image'
import type { Litter, HzdSetting } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface LitterDetailsModalProps {
    litter: Litter | null
    strapiBaseUrl: string
    isOpen: boolean
    onClose: () => void
    hzdSetting?: HzdSetting | null
    distance: number | null
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

export function LitterDetailsModal({
    litter,
    strapiBaseUrl,
    isOpen,
    onClose,
    hzdSetting,
    distance,
    formatDate,
}: LitterDetailsModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            window.addEventListener('keydown', handleEscape)
        }

        return () => {
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen || !litter) {
        return null
    }

    const orderLetter = litter.OrderLetter ?? ''
    const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
    const breederMember = ((litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')).trim()
    const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
    const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            onClick={onClose}
        >
            <div
                className='relative max-h-[90vh] w-full max-w-[100vw] overflow-y-auto rounded-lg bg-white shadow-xl md:max-w-3xl'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    aria-label='Schließen'
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 16,
                        zIndex: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: 2,
                        '&:hover': {
                            backgroundColor: 'white',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* Content */}
                <div className='p-8'>
                    {/* Header */}
                    <div className='mb-6 flex items-center justify-between'>
                        <h2 className='text-3xl font-bold text-gray-900'>
                            {orderLetter}-Wurf: {kennelName}
                        </h2>
                        {renderStatusBadge(litter.LitterStatus)}
                    </div>

                    {/* Images - 3 columns */}
                    <div className='mb-6 grid grid-cols-3 gap-4'>
                        {/* Mother */}
                        <div className='relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
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
                        {/* Stunt Dog */}
                        <div className='relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
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
                        {/* Puppy image or placeholder */}
                        <div className='relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
                            <Image
                                src={litter.PuppyImage ? resolveMediaUrl(litter.PuppyImage, strapiBaseUrl) || '/static-images/placeholder/puppies.png' : '/static-images/placeholder/puppies.png'}
                                alt="Welpen"
                                fill
                                className='object-cover'
                                unoptimized
                            />
                        </div>
                    </div>

                    {/* Info block – two columns */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <p className="text-sm"><strong>Zwinger:</strong> {kennelName}</p>
                            {breederMember && <p className="text-sm"><strong>Name:</strong> {breederMember}</p>}
                            {distance !== null && <p className="text-sm"><strong>Entfernung:</strong> ~{Math.round(distance)} km</p>}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm"><strong>Mutter:</strong> {motherName}</p>
                            {stuntDogName && <p className="text-sm"><strong>Deckrüde:</strong> {stuntDogName}</p>}
                        </div>
                    </div>

                    {/* Dates and Details */}
                    <div className='space-y-3 text-sm text-gray-600 mb-6'>
                        {litter.dateOfManting && (
                            <p><strong>Deckdatum:</strong> {formatDate(litter.dateOfManting)}</p>
                        )}
                        {litter.expectedDateOfBirth && (
                            <p><strong>Erwartetes Geburtsdatum:</strong> {formatDate(litter.expectedDateOfBirth)}</p>
                        )}
                        {litter.dateOfBirth && (
                            <p><strong>Geburtsdatum:</strong> {formatDate(litter.dateOfBirth)}</p>
                        )}
                    </div>

                    {/* Puppy Counts */}
                    {(litter.AmountRS || litter.AmountRSM || litter.AmountRB || litter.AmountHS || litter.AmountHSM || litter.AmountHB) && (
                        <div className='mb-6 space-y-2 border-t border-gray-200 pt-4'>
                            <div className="flex justify-between items-center mb-2">
                                <p className='font-medium text-gray-700'>Welpen:</p>
                                <div className="flex gap-4 text-[10px] text-gray-500 font-bold">
                                    <span>RUDEN (R)</span>
                                    <span>HÜNDINNEN (H)</span>
                                </div>
                            </div>

                            {[
                                { key: 'S', label: 'Schwarz' },
                                { key: 'SM', label: 'Schwarzmarken' },
                                { key: 'B', label: 'Blond' }
                            ].map(({ key, label }) => {
                                const male = (litter as any)[`AmountR${key}`]
                                const female = (litter as any)[`AmountH${key}`]
                                if (!male && !female) return null

                                return (
                                    <div key={key} className="flex justify-between items-center pl-2">
                                        <span className="text-sm"><strong>{label}:</strong></span>
                                        <div className="flex gap-4 font-mono text-sm">
                                            <span className={male?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}>
                                                {male?.Available ?? 0}/{male?.Total ?? 0}
                                            </span>
                                            <span className={female?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}>
                                                {female?.Available ?? 0}/{female?.Total ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Status Message */}
                    {litter.StatusMessage && (
                        <div className='rounded bg-blue-50 p-4'>
                            <p className='text-sm text-blue-700'>{litter.StatusMessage}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
