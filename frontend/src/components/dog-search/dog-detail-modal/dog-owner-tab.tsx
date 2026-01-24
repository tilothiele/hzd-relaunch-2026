'use client'

import { Tooltip } from '@mui/material'
import type { Dog } from '@/types'
import PersonIcon from '@mui/icons-material/Person'
import HomeIcon from '@mui/icons-material/Home'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import ContactMailIcon from '@mui/icons-material/ContactMail'

interface DogOwnerTabProps {
    dog: Dog
}

export function DogOwnerTab({ dog }: DogOwnerTabProps) {
    const owner = dog.owner

    if (!owner) {
        return (
            <div className='flex items-center justify-center p-8'>
                <p className='text-gray-500'>Keine Besitzerinformationen verfügbar.</p>
            </div>
        )
    }

    const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(' ')
    const address = [
        owner.address1,
        owner.address2,
        [owner.zip, owner.city].filter(Boolean).join(' '),
        owner.countryCode,
    ].filter(Boolean)

    const hasContact = owner.phone || owner.email

    return (
        <div className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-4'>
                    {/* Name */}
                    <div className='flex items-start gap-4'>
                        <Tooltip title='Besitzer' arrow>
                            <div className='flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-100 text-gray-600'>
                                <PersonIcon />
                            </div>
                        </Tooltip>
                        <div className='pt-2'>
                            <p className='text-base font-medium text-gray-900'>{ownerName || 'Unbekannt'}</p>
                        </div>
                    </div>

                    {/* Address */}
                    {address.length > 0 && (
                        <div className='flex items-start gap-4'>
                            <Tooltip title='Anschrift' arrow>
                                <div className='flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-100 text-gray-600'>
                                    <HomeIcon />
                                </div>
                            </Tooltip>
                            <div className='pt-2'>
                                {address.map((line, index) => (
                                    <p key={index} className='text-base text-gray-600'>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className='space-y-4'>
                    {/* Contact */}
                    {hasContact && (
                        <>
                            {owner.phone && (
                                <div className='flex items-center gap-4'>
                                    <Tooltip title='Telefon' arrow>
                                        <div className='flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-100 text-gray-600'>
                                            <PhoneIcon />
                                        </div>
                                    </Tooltip>
                                    <div>
                                        <a href={`tel:${owner.phone}`} className='text-base text-blue-600 hover:underline'>
                                            {owner.phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {owner.email && (
                                <div className='flex items-center gap-4'>
                                    <Tooltip title='E-Mail' arrow>
                                        <div className='flex h-10 w-10 shrink-0 cursor-help items-center justify-center rounded-full bg-gray-100 text-gray-600'>
                                            <EmailIcon />
                                        </div>
                                    </Tooltip>
                                    <div>
                                        <a href={`mailto:${owner.email}`} className='text-base text-blue-600 hover:underline'>
                                            {owner.email}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
