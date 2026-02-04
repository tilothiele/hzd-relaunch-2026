'use client'

import type { Dog } from '@/types'
import { Box, Typography, Button } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'

interface DogDocumentsTabProps {
    dog: Dog
    strapiBaseUrl: string | null | undefined
}

export function DogDocumentsTab({ dog, strapiBaseUrl }: DogDocumentsTabProps) {
    const documents = dog.DogDocument

    if (!documents || documents.length === 0) {
        return (
            <div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
                <p>Keine Dokumente verfügbar.</p>
            </div>
        )
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map((doc) => (
                <Box key={doc.id} sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    backgroundColor: 'white',
                    overflow: 'hidden'
                }}>
                    {doc.Description && (
                        <Box sx={{
                            backgroundColor: '#f9fafb',
                            px: 2,
                            py: 1.5,
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {doc.Description}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ p: 0 }}>
                        {doc.MediaFile?.map((file, index) => {
                            const fileUrl = file.url.startsWith('http') ? file.url : `${strapiBaseUrl}${file.url}`
                            return (
                                <Box key={`${doc.id}-${file.url}`} sx={{
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: index < (doc.MediaFile?.length || 0) - 1 ? '1px solid #f3f4f6' : 'none'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body2" sx={{
                                            color: 'text.secondary',
                                            minWidth: '80px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {Math.round((file.size || 0) * 100) / 100} KB
                                        </Typography>
                                        <Typography variant="body1">
                                            {file.name}
                                        </Typography>
                                    </Box>
                                    <Button
                                        component="a"
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        startIcon={<DownloadIcon />}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Download
                                    </Button>
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    )
}
