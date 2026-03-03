'use client'

import { useDogs } from '@/hooks/use-dogs'
import { Box, CircularProgress, Link as MuiLink, Pagination, Typography, Modal, IconButton } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { resolveDogImage } from '@/lib/dog-utils'
import { formatDate } from '@/lib/date-utils'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import { theme } from '@/themes'
import type { HzdSetting } from '@/types'

interface BreederDogsListProps {
    ownerDocumentId: string
    strapiBaseUrl?: string | null
    hzdSetting?: HzdSetting | null
}

export function BreederDogsList({ ownerDocumentId, strapiBaseUrl, hzdSetting }: BreederDogsListProps) {
    const [page, setPage] = useState(1)
    const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null)
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

    const handleZoomClose = () => setZoomImage(null)

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

            <div className='flex flex-col gap-1'>
                {dogs.map((dog) => {
                    const avatarUrl = resolveDogImage(dog, hzdSetting, strapiBaseUrl)

                    return (
                        <div
                            key={dog.documentId}
                            className='flex flex-row items-center justify-between gap-1 border-b border-gray-100 pb-1 last:border-0'
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

                            <div
                                className='relative w-48 h-36 shrink-0 overflow-hidden rounded bg-gray-100 cursor-zoom-in group/img'
                                onClick={() => setZoomImage({ url: avatarUrl, name: dog.fullKennelName ?? dog.givenName ?? 'Hund' })}
                            >
                                <Image
                                    src={avatarUrl}
                                    alt={dog.givenName ?? 'Hund'}
                                    fill
                                    className='object-cover transition-transform duration-300 group-hover/img:scale-110'
                                    unoptimized
                                    sizes='192px'
                                />
                                <div className='absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center'>
                                    <div className='opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/80 p-1.5 rounded-full shadow-md'>
                                        <OpenInNewIcon sx={{ fontSize: 18, color: 'action.active' }} />
                                    </div>
                                </div>
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
        </Box>
    )
}
