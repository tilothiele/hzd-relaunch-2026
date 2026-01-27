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
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import type { AuthUser, Dog, DogSearchResult } from '@/types'
import { formatDate } from '@/lib/utils'

interface MeineHundeTabProps {
    user: AuthUser | null
    strapiBaseUrl?: string | null
}

export function MeineHundeTab({ user, strapiBaseUrl }: MeineHundeTabProps) {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOnlyFertile, setShowOnlyFertile] = useState(false)

    useEffect(() => {
        async function loadDogs() {
            if (!user?.documentId) return

            setLoading(true)
            setError(null)
            try {
                const filters: any = {
                    owner: {
                        documentId: {
                            eq: user.documentId
                        }
                    }
                }

                if (showOnlyFertile) {
                    filters.cFertile = { eq: true }
                }

                const response = await fetchGraphQL<DogSearchResult>(SEARCH_DOGS, {
                    variables: {
                        filters,
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
    }, [user, strapiBaseUrl, showOnlyFertile])

    const handleFertileToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowOnlyFertile(event.target.checked)
    }

    if (loading && dogs.length === 0) {
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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6'>
                    Meine Zuchthunde
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showOnlyFertile}
                            onChange={handleFertileToggle}
                            color="primary"
                        />
                    }
                    label="Nur zuchtfähige Hunde"
                />
            </Box>

            {!dogs.length ? (
                <Box sx={{ p: 2 }}>
                    <Typography>Keine Hunde gefunden.</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table sx={{ minWidth: 650 }} aria-label="meine hunde tabelle">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Wurfdatum</TableCell>
                                <TableCell>Geschlecht</TableCell>
                                <TableCell>Farbe</TableCell>
                                <TableCell>Zuchtbuch-Nr.</TableCell>
                                <TableCell>Chip-Nr.</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dogs.map((dog) => {
                                const isFertile = dog.cFertile === true
                                return (
                                    <TableRow
                                        key={dog.documentId}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Box component="span" sx={!isFertile ? { fontStyle: 'italic' } : {}}>
                                                {dog.fullKennelName || dog.givenName}
                                            </Box>
                                            {!isFertile && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    (nicht zuchtfähig)
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dog.dateOfBirth ? formatDate(dog.dateOfBirth) : '-'}
                                        </TableCell>
                                        <TableCell>{dog.sex}</TableCell>
                                        <TableCell>{dog.color || '-'}</TableCell>
                                        <TableCell>{dog.cStudBookNumber || '-'}</TableCell>
                                        <TableCell>{dog.microchipNo || '-'}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}
