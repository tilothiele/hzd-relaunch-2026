'use client'

import { DogCard } from '@/components/dog-search/dog-card'
import { useDogs } from '@/hooks/use-dogs'
import { Box, CircularProgress, Pagination, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

interface BreederDogsListProps {
    ownerDocumentId: string
    strapiBaseUrl?: string | null
}

export function BreederDogsList({ ownerDocumentId, strapiBaseUrl }: BreederDogsListProps) {
    const [page, setPage] = useState(1)
    const pageSize = 5

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

    console.log('dogs', dogs)
    console.log('ownerDocumentId', ownerDocumentId)

    const handlePageChange = (_: unknown, value: number) => {
        setPage(value)
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!isLoading && dogs.length === 0) {
        return null
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant='h6' gutterBottom sx={{ borderBottom: '1px solid #e5e7eb', pb: 1, mb: 3 }}>
                Hunde im Besitz ({totalDogs})
            </Typography>

            <div className='grid gap-4 md:grid-cols-2'>
                {dogs.map((dog) => (
                    <DogCard
                        key={dog.documentId}
                        dog={dog}
                        strapiBaseUrl={strapiBaseUrl}
                    />
                ))}
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
