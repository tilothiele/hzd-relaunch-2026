'use client'

import React from 'react'
import Image from 'next/image'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { formatDayMonthYear } from '@/lib/date-utils'
import type { Litter, HzdSetting } from '@/types'
import {
	getPuppyAvailabilityRows,
	PuppyAvailabilityCardRows,
} from '@/components/litter-search/puppy-availability'

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
        case 'Manted': return 'Erwartet'
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
    const breederMember = litter.breeder?.Address?.FullName?.trim() ?? ''
    const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
    const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName
    const puppyRows = getPuppyAvailabilityRows(litter)


    return (
        <div
            key={litter.documentId}
            className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:border-gray-400 hover:bg-gray-100 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
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
                <div className='group relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
                    <Image
                        src={resolveMediaUrl(
                            litter.mother?.avatar ||
                            (litter.mother?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
                                litter.mother?.color === 'B' ? hzdSetting?.DefaultAvatarB :
                                    hzdSetting?.DefaultAvatarS),
                            strapiBaseUrl
                        ) || ''}
                        alt="Zuchthündin"
                        fill
                        className='object-cover transition-transform duration-300 group-hover:scale-110'
                        unoptimized
                    />
                </div>
                {/* Stunt Dog */}
                <div className='group relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
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
                        className='object-cover transition-transform duration-300 group-hover:scale-110'
                        unoptimized
                    />
                </div>
                {/* Puppy image or placeholder */}
                <div className='group relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100'>
                    <Image
                        src={resolveMediaUrl(
                            litter.PuppyImage || hzdSetting?.DefaultLitterAvatar,
                            strapiBaseUrl
                        ) || '/static-images/placeholder/puppies.png'}
                        alt="Welpen"
                        fill
                        className='object-cover transition-transform duration-300 group-hover:scale-110'
                        unoptimized
                    />
                </div>
            </div>

            {/* Info block – Table */}
            <div className="mb-4">
                <table className="w-full text-sm text-gray-600">
                    <tbody>
                        <tr className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-bold w-[40%] align-top">Zwinger:</td>
                            <td className="py-2 align-top">{kennelName}</td>
                        </tr>
                        {distance !== null && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Entfernung:</td>
                                <td className="py-2 align-top">~{Math.round(distance)} km</td>
                            </tr>
                        )}
                        <tr className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-bold align-top">Züchter:</td>
                            <td className="py-2 align-top">{breederMember}</td>
                        </tr>
                        <tr className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-bold align-top">Zuchthündin:</td>
                            <td className="py-2 align-top">{motherName}</td>
                        </tr>
                        {stuntDogName && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Deckrüde:</td>
                                <td className="py-2 align-top">{stuntDogName}</td>
                            </tr>
                        )}
                        {litter.LitterStatus === 'Planned' && litter.plannedDateOfBirth && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Wurf geplant:</td>
                                <td className="py-2 align-top">
                                    {new Date(litter.plannedDateOfBirth).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                                </td>
                            </tr>
                        )}
                        {litter.LitterStatus === 'Manted' ? (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Vorauss. Wurfdatum:</td>
                                <td className="py-2 align-top">{formatDayMonthYear(litter.expectedDateOfBirth)}</td>
                            </tr>
                        ) : litter.LitterStatus !== 'Littered' && litter.expectedDateOfBirth ? (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Erw. Wurfdatum:</td>
                                <td className="py-2 align-top">{formatDate(litter.expectedDateOfBirth)}</td>
                            </tr>
                        ) : null}
                        {litter.dateOfBirth && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Wurfdatum:</td>
                                <td className="py-2 align-top">{formatDate(litter.dateOfBirth)}</td>
                            </tr>
                        )}
                        {litter.LitterStatus === 'Littered' && puppyRows.length > 0 ? (
                            <PuppyAvailabilityCardRows rows={puppyRows} />
                        ) : null}
                    </tbody>
                </table>
            </div>
            {litter.StatusMessage ? (
                <div className='mt-3 rounded bg-blue-50 p-2'>
                    <p className='text-xs text-blue-700'>{litter.StatusMessage}</p>
                </div>
            ) : null}
        </div>

    )
}
