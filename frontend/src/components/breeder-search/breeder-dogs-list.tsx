'use client'

import { useDogs } from '@/hooks/use-dogs'
import { Box, CircularProgress, Link as MuiLink, Pagination, Typography } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { resolveDogImage } from '@/lib/dog-utils'
import { formatDate } from '@/lib/date-utils'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { HzdSetting } from '@/types'

interface BreederDogsListProps {
    ownerDocumentId: string
    strapiBaseUrl?: string | null
    hzdSetting?: HzdSetting | null
}

export function BreederDogsList({ ownerDocumentId, strapiBaseUrl, hzdSetting }: BreederDogsListProps) {
    const [page, setPage] = useState(1)
    const pageSize = 5

    // useDogs filtert standardmäßig nach 'cFertile: true', was hier gewünscht ist.
    const { dogs, totalDogs, pageCount, isLoading } = useDogs(
        useMemo(() => ({
            filters: {
                ownerDocumentId,
                sort: ['givenName:asc'],
            },
            pagination: {
                page,
                pageSize,
            },
            baseUrl: strapiBaseUrl,
        }), [ownerDocumentId, page, pageSize, strapiBaseUrl])
    )

    const handlePageChange = (_: unknown, value: number) => {
        setPage(value)
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={30} />
            </Box>
        )
    }

    if (!isLoading && dogs.length === 0) {
        return null
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant='h6' gutterBottom sx={{ borderBottom: '1px solid #e5e7eb', pb: 1, mb: 3 }}>
                Zuchthündinnen ({totalDogs})
            </Typography>

            <div className='flex flex-col gap-4'>
                {dogs.map((dog) => {
                    const avatarUrl = resolveDogImage(dog, hzdSetting, strapiBaseUrl)

                    return (
                        <div
                            key={dog.documentId}
                            className='flex flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0'
                        >
                            <div className='flex-1 min-w-0'>
                                <h4 className='text-sm font-bold text-gray-900 truncate mb-1'>
                                    <Link href={`/hunde?id=${dog.documentId}`} className="hover:underline flex items-center gap-1 group">
                                        {dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}
                                        <OpenInNewIcon
                                            sx={{ fontSize: 14 }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
                                        />
                                    </Link>
                                </h4>
                                <div className='text-xs text-gray-600 space-y-0.5'>
                                    {dog.dateOfBirth && (
                                        <p>
                                            <span className='font-medium'>Geb.:</span> {formatDate(dog.dateOfBirth)}
                                        </p>
                                    )}
                                    {dog.cStudBookNumber && (
                                        <p>
                                            <span className='font-medium'>Zuchtbuch-Nr.:</span> {dog.cStudBookNumber}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className='relative w-48 h-36 shrink-0 overflow-hidden rounded bg-gray-100'>
                                <Image
                                    src={avatarUrl}
                                    alt={dog.givenName ?? 'Hund'}
                                    fill
                                    className='object-cover'
                                    unoptimized
                                    sizes='192px'
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {pageCount > 1 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={pageCount}
                        page={page}
                        onChange={handlePageChange}
                        color='primary'
                        size='small'
                    />
                </Box>
            )}
        </Box>
    )
}
