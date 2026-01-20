'use client'

import React from 'react'
import Image from 'next/image'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import type { Litter, HzdSetting } from '@/types'

interface LitterCardProps {
    litter: Litter
    strapiBaseUrl: string
    hzdSetting?: HzdSetting | null
    distance: number | null
    formatDate: (dateString: string | null | undefined) => string
    onClick?: () => void
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

const renderStatusBadge = (status: Litter['LitterStatus'], small = false) => {
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
        <span className={`rounded font-medium uppercase ${colorClasses} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
            {label}
        </span>
    )
}

export function LitterCard({ litter, strapiBaseUrl, hzdSetting, distance, formatDate, onClick }: LitterCardProps) {
    const orderLetter = litter.OrderLetter ?? ''
    const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
    const breederMember = ((litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')).trim()
    const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
    const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName

    console.log(litter?.breeder)
    return (
        <div
            key={litter.documentId}
            className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                    {orderLetter}-Wurf: {kennelName}
                </h3>
                {renderStatusBadge(litter.LitterStatus)}
            </div>

            {/* Images - 3 columns */}
            <div className='mb-4 grid grid-cols-3 gap-4'>
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
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                    <p><strong>Zwinger:</strong> {kennelName}</p>
                    {distance !== null && <p><strong>Entfernung:</strong> ~{Math.round(distance)} km</p>}
                </div>
                <div>
                    <p><strong>Züchter:</strong> {breederMember}</p>
                </div>
                <div>
                    <p><strong>Mutter:</strong> {motherName}</p>
                    {stuntDogName && <p><strong>Deckrüde:</strong> {stuntDogName}</p>}
                </div>
            </div>

            <div className='space-y-2 text-sm text-gray-600'>
                {litter.dateOfManting ? (
                    <p>
                        <strong>Deckdatum:</strong> {formatDate(litter.dateOfManting)}
                    </p>
                ) : null}
                {litter.expectedDateOfBirth ? (
                    <p>
                        <strong>Erwartetes Geburtsdatum:</strong> {formatDate(litter.expectedDateOfBirth)}
                    </p>
                ) : null}
                {litter.dateOfBirth ? (
                    <p>
                        <strong>Geburtsdatum:</strong> {formatDate(litter.dateOfBirth)}
                    </p>
                ) : null}
                {(litter.AmountRS || litter.AmountRSM || litter.AmountRB || litter.AmountHS || litter.AmountHSM || litter.AmountHB) ? (
                    <div className='mt-3 space-y-1 border-t border-gray-200 pt-2'>
                        <div className="flex justify-between items-center mb-1">
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
                ) : null}
                {litter.StatusMessage ? (
                    <div className='mt-3 rounded bg-blue-50 p-2'>
                        <p className='text-xs text-blue-700'>{litter.StatusMessage}</p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
