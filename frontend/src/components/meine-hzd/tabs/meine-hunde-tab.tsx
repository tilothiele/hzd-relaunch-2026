import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import type { AuthUser, Dog, DogSearchResult } from '@/types'
import { formatDate } from '@/lib/utils' // Assuming there is a utility for date formatting, otherwise I'll use native Date

interface MeineHundeTabProps {
    user: AuthUser | null
    strapiBaseUrl?: string | null
}

export function MeineHundeTab({ user, strapiBaseUrl }: MeineHundeTabProps) {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadDogs() {
            if (!user?.documentId) return

            setLoading(true)
            setError(null)
            try {
                const response = await fetchGraphQL<DogSearchResult>(SEARCH_DOGS, {
                    variables: {
                        filters: {
                            owner: {
                                documentId: {
                                    eq: user.documentId
                                }
                            },
                            cFertile: {
                                eq: true
                            }
                        },
                        pagination: {
                            pageSize: 100 // Fetch all or reasonably many
                        },
                        sort: ["dateOfBirth:desc"]
                    },
                    baseUrl: strapiBaseUrl
                })

                if (response?.hzdPluginDogs_connection?.nodes) {
                    setDogs(response.hzdPluginDogs_connection.nodes)
                } else {
                    setDogs([])
                }
            } catch (err) {
                console.error('Failed to load dogs', err)
                setError('Fehler beim Laden der Hunde.')
            } finally {
                setLoading(false)
            }
        }

        loadDogs()
    }, [user, strapiBaseUrl])

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        )
    }

    if (!dogs.length) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography>Keine Hunde gefunden.</Typography>
            </Box>
        )
    }

    return (
        <Box>
            <Typography variant='h6' gutterBottom>
                Meine Zuchthunde
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} aria-label="meine hunde tabelle">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Wurfdatum</TableCell>
                            <TableCell>Geschlecht</TableCell>
                            <TableCell>Chip-Nr.</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dogs.map((dog) => (
                            <TableRow
                                key={dog.documentId}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {dog.fullKennelName || dog.givenName}
                                </TableCell>
                                <TableCell>
                                    {dog.dateOfBirth ? new Date(dog.dateOfBirth).toLocaleDateString('de-DE') : '-'}
                                </TableCell>
                                <TableCell>{dog.sex}</TableCell>
                                <TableCell>{dog.microchipNo || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
