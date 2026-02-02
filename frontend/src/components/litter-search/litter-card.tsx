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
                            <td className="py-2 font-bold align-top">Mutter:</td>
                            <td className="py-2 align-top">{motherName}</td>
                        </tr>
                        {stuntDogName && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Deckrüde:</td>
                                <td className="py-2 align-top">{stuntDogName}</td>
                            </tr>
                        )}
                        {litter.dateOfManting && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Deckdatum:</td>
                                <td className="py-2 align-top">{formatDate(litter.dateOfManting)}</td>
                            </tr>
                        )}
                        {litter.expectedDateOfBirth && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Erw. Geburtsdatum:</td>
                                <td className="py-2 align-top">{formatDate(litter.expectedDateOfBirth)}</td>
                            </tr>
                        )}
                        {litter.dateOfBirth && (
                            <tr className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-bold align-top">Geburtsdatum:</td>
                                <td className="py-2 align-top">{formatDate(litter.dateOfBirth)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {(litter.AmountRS || litter.AmountRSM || litter.AmountRB || litter.AmountHS || litter.AmountHSM || litter.AmountHB) ? (
                <div className='mt-3 space-y-1 border-t border-gray-200 pt-2'>
                    <table className="w-full">
                        <thead>
                            <tr className="text-gray-500">
                                <th className="text-left font-medium pb-2"></th>
                                <th className="text-center font-bold pb-2">RÜDEN</th>
                                <th className="text-center font-bold pb-2">HÜNDINNEN</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {[
                                { key: 'S', label: 'Schwarz' },
                                { key: 'SM', label: 'Schwarzmarken' },
                                { key: 'B', label: 'Blond' }
                            ].map(({ key, label }) => {
                                const male = (litter as any)[`AmountR${key}`]
                                const female = (litter as any)[`AmountH${key}`]
                                if (!male && !female) return null

                                const hasAvailable = (male?.Available ?? 0) > 0 || (female?.Available ?? 0) > 0
                                const rowClass = hasAvailable ? 'border-b border-gray-100 last:border-0' : 'border-b border-gray-100 last:border-0 text-gray-400'

                                return (
                                    <tr key={key} className={rowClass}>
                                        <td className="py-1 font-medium">{label}</td>
                                        <td className="py-1 text-center font-mono">
                                            <span className={male?.Available > 0 ? 'text-green-700 font-bold' : (!hasAvailable ? 'text-gray-400' : 'text-gray-600')}>
                                                {male?.Available ?? 0}/{male?.Total ?? 0}
                                            </span>
                                        </td>
                                        <td className="py-1 text-center font-mono">
                                            <span className={female?.Available > 0 ? 'text-green-700 font-bold' : (!hasAvailable ? 'text-gray-400' : 'text-gray-600')}>
                                                {female?.Available ?? 0}/{female?.Total ?? 0}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : null}
            {litter.StatusMessage ? (
                <div className='mt-3 rounded bg-blue-50 p-2'>
                    <p className='text-xs text-blue-700'>{litter.StatusMessage}</p>
                </div>
            ) : null}
        </div>

    )
}
