'use client'

import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Button, Grid, TextField, CircularProgress, Chip, Alert, MenuItem, Select, Autocomplete } from '@mui/material'
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import type { Breeder, Litter, LitterSearchResult, Dog, DogSearchResult } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_LITTERS_BY_BREEDER, SEARCH_DOGS } from '@/lib/graphql/queries'
import { UPDATE_LITTER, CREATE_LITTER } from '@/lib/graphql/mutations'
import { formatDate } from '@/lib/utils'
import { Add as AddIcon } from '@mui/icons-material'

interface MeineWuerfeTabProps {
    breeder: Breeder
    strapiBaseUrl?: string | null
}

interface PuppyAmountInput {
    Total: number
    Available: number
}

interface LitterFormData {
    LitterStatus: 'Planned' | 'Manted' | 'Littered' | 'Closed'
    StatusMessageDraft: string
    OrderLetter: string
    mother: string | null
    stuntDog: string | null
    plannedDateOfBirth: string | null
    expectedDateOfBirth: string | null
    dateOfBirth: string | null
    AmountRS: PuppyAmountInput
    AmountRSM: PuppyAmountInput
    AmountRB: PuppyAmountInput
    AmountHS: PuppyAmountInput
    AmountHSM: PuppyAmountInput
    AmountHB: PuppyAmountInput
}

function PuppyAmountField({ label, value, onChange, disabled }: { label: string, value: PuppyAmountInput, onChange: (val: PuppyAmountInput) => void, disabled?: boolean }) {
    const handleTotalChange = (newTotal: number) => {
        const validTotal = Math.max(0, newTotal)
        // If Available > newTotal, clamp Available down
        let validAvailable = value.Available
        if (value.Available > validTotal) {
            validAvailable = validTotal
        }
        onChange({ Total: validTotal, Available: validAvailable })
    }

    const handleAvailableChange = (newAvailable: number) => {
        // Available cannot be > Total
        const validAvailable = Math.max(0, Math.min(newAvailable, value.Total))
        onChange({ ...value, Available: validAvailable })
    }

    return (
        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, height: '100%', width: '100%', bgcolor: disabled ? '#f5f5f5' : 'white' }}>
            <Typography variant='subtitle2' gutterBottom color={disabled ? 'text.secondary' : 'text.primary'}>{label}</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label='Gesamt'
                    type='number'
                    size='small'
                    value={value.Total}
                    onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                    disabled={disabled}
                    fullWidth
                />
                <TextField
                    label='Frei'
                    type='number'
                    size='small'
                    value={value.Available}
                    onChange={(e) => handleAvailableChange(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: value.Total }}
                    disabled={disabled}
                    fullWidth
                />
            </Box>
        </Box>
    )
}

export function MeineWuerfeTab({ breeder, strapiBaseUrl }: MeineWuerfeTabProps) {
    const [litters, setLitters] = useState<Litter[]>([])
    const [loading, setLoading] = useState(true)
    const [editingLitterId, setEditingLitterId] = useState<string | null>(null)
    const [editFormData, setEditFormData] = useState<LitterFormData | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [validationWarning, setValidationWarning] = useState<string | null>(null)

    const [breedingBitches, setBreedingBitches] = useState<Dog[]>([])
    const [fatherOptions, setFatherOptions] = useState<Dog[]>([])
    const [fatherSearchInput, setFatherSearchInput] = useState('')
    const [selectedFather, setSelectedFather] = useState<Dog | null>(null)
    const [loadingFathers, setLoadingFathers] = useState(false)

    // Fetch breeding bitches (mothers)
    useEffect(() => {
        async function loadMothers() {
            if (!breeder?.owner_member?.documentId) return
            try {
                const data = await fetchGraphQL<DogSearchResult>(SEARCH_DOGS, {
                    variables: {
                        filters: {
                            sex: { eq: 'F' },
                            owner: { documentId: { eq: breeder.owner_member.documentId } },
                            cFertile: { eq: true }
                        },
                        pagination: { limit: 100 }
                    },
                    baseUrl: strapiBaseUrl
                })
                setBreedingBitches(data.hzdPluginDogs_connection.nodes || [])
            } catch (error) {
                console.error('Failed to load mothers:', error)
            }
        }
        loadMothers()
    }, [breeder, strapiBaseUrl])

    // Debounce Father search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!fatherSearchInput || fatherSearchInput.length < 2) {
                setFatherOptions(selectedFather ? [selectedFather] : [])
                return
            }

            setLoadingFathers(true)
            try {
                const date15YearsAgo = new Date()
                date15YearsAgo.setFullYear(date15YearsAgo.getFullYear() - 15)
                const minDateOfBirth = date15YearsAgo.toISOString().split('T')[0]

                const data = await fetchGraphQL<DogSearchResult>(SEARCH_DOGS, {
                    variables: {
                        filters: {
                            sex: { eq: 'M' },
                            fullKennelName: { contains: fatherSearchInput },
                            dateOfBirth: { gte: minDateOfBirth },
                            or: [
                                { Disabled: { eq: false } },
                                { Disabled: { null: true } }
                            ]
                        },
                        pagination: { limit: 20 }
                    },
                    baseUrl: strapiBaseUrl
                })

                const results = data.hzdPluginDogs_connection.nodes || []
                // Ensure selected father remains in options if selected
                if (selectedFather && !results.find(d => d.documentId === selectedFather.documentId)) {
                    results.unshift(selectedFather)
                }
                setFatherOptions(results)
            } catch (error) {
                console.error('Failed to search fathers:', error)
            } finally {
                setLoadingFathers(false)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [fatherSearchInput, selectedFather, strapiBaseUrl])

    useEffect(() => {
        async function loadLitters() {
            if (!breeder?.documentId) return
            try {
                const data = await fetchGraphQL<LitterSearchResult>(GET_LITTERS_BY_BREEDER, {
                    variables: { breederId: breeder.documentId },
                    baseUrl: strapiBaseUrl,
                })
                setLitters(data.hzdPluginLitters_connection.nodes || [])
            } catch (error) {
                console.error('Failed to load litters:', error)
            } finally {
                setLoading(false)
            }
        }
        loadLitters()
    }, [breeder, strapiBaseUrl])

    useEffect(() => {
        if (!editFormData) {
            setValidationError(null)
            setValidationWarning(null)
            return
        }

        let error = null
        let warning = null
        let totalPuppies = 0

        Object.values(editFormData).forEach((val) => {
            if (typeof val === 'object' && val !== null && 'Total' in val) {
                const puppyAmount = val as PuppyAmountInput
                if (puppyAmount.Total < 0 || puppyAmount.Available < 0) {
                    error = 'Werte dürfen nicht negativ sein.'
                }
                if (puppyAmount.Available > puppyAmount.Total) {
                    // Should be prevented by input handlers, but double check
                    error = 'Anzahl "Frei" darf nicht größer als "Gesamt" sein.'
                }
                totalPuppies += puppyAmount.Total
            }
        })

        if (totalPuppies > 15) {
            warning = 'Hinweis: Die Gesamtzahl der Welpen ist ungewöhnlich hoch (> 15).'
        }

        setValidationError(error)
        setValidationWarning(warning)
    }, [editFormData])

    const handleEditClick = (litter: Litter) => {
        setEditingLitterId(litter.documentId)
        setEditFormData({
            LitterStatus: litter.LitterStatus,
            StatusMessageDraft: litter.StatusMessageDraft || '',
            OrderLetter: litter.OrderLetter || 'A',
            AmountRS: { Total: litter.AmountRS?.Total || 0, Available: litter.AmountRS?.Available || 0 },
            AmountRSM: { Total: litter.AmountRSM?.Total || 0, Available: litter.AmountRSM?.Available || 0 },
            AmountRB: { Total: litter.AmountRB?.Total || 0, Available: litter.AmountRB?.Available || 0 },
            AmountHS: { Total: litter.AmountHS?.Total || 0, Available: litter.AmountHS?.Available || 0 },
            AmountHSM: { Total: litter.AmountHSM?.Total || 0, Available: litter.AmountHSM?.Available || 0 },
            AmountHB: { Total: litter.AmountHB?.Total || 0, Available: litter.AmountHB?.Available || 0 },
            mother: litter.mother?.documentId || null,
            stuntDog: litter.stuntDog?.documentId || null,
            plannedDateOfBirth: litter.plannedDateOfBirth || null,
            expectedDateOfBirth: litter.expectedDateOfBirth || null,
            dateOfBirth: litter.dateOfBirth || null,
        })

        // Initialize selected father for Autocomplete
        if (litter.stuntDog) {
            // @ts-ignore - casting simpler object to Dog for option display
            const initialFather: Dog = {
                documentId: litter.stuntDog.documentId,
                fullKennelName: litter.stuntDog.fullKennelName || '',
                // other fields optional/mocked if needed for display
            }
            setSelectedFather(initialFather)
            setFatherOptions([initialFather])
        } else {
            setSelectedFather(null)
            setFatherOptions([])
        }
    }

    const handleCancelEdit = () => {
        setEditingLitterId(null)
        setEditFormData(null)
        setValidationError(null)
        setValidationWarning(null)
    }

    const handleSave = async (litterId: string) => {
        if (!editFormData || validationError) return
        setIsSaving(true)
        try {
            const result = await fetchGraphQL<{ updateHzdPluginLitter: Litter }>(UPDATE_LITTER, {
                variables: {
                    documentId: litterId,
                    data: editFormData
                },
                baseUrl: strapiBaseUrl
            })

            // Update local state with the returned data which includes resolved relations
            if (result.updateHzdPluginLitter) {
                setLitters(litters.map(l => l.documentId === litterId ? result.updateHzdPluginLitter : l))
            }

            setEditingLitterId(null)
            setEditFormData(null)
        } catch (error) {
            console.error('Failed to save litter:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCreateLitter = async () => {
        if (!breeder?.documentId) return
        setIsCreating(true)
        try {
            // Create a new litter with default values
            // We need to provide the minimal required fields
            const newLitterData = {
                LitterStatus: 'Planned',
                breeder: breeder.documentId,
                // These are likely required or good defaults
                AmountRS: { Total: 0, Available: 0 },
                AmountRSM: { Total: 0, Available: 0 },
                AmountRB: { Total: 0, Available: 0 },
                AmountHS: { Total: 0, Available: 0 },
                AmountHSM: { Total: 0, Available: 0 },
                AmountHB: { Total: 0, Available: 0 },
                OrderLetter: 'A' // Backend might handle this or we might need to calculate it
            }

            const result = await fetchGraphQL<{ createHzdPluginLitter: Litter }>(CREATE_LITTER, {
                variables: { data: newLitterData },
                baseUrl: strapiBaseUrl
            })

            const newLitter = result.createHzdPluginLitter
            if (newLitter) {
                // Refresh litters list
                const data = await fetchGraphQL<LitterSearchResult>(GET_LITTERS_BY_BREEDER, {
                    variables: { breederId: breeder.documentId },
                    baseUrl: strapiBaseUrl,
                })
                setLitters(data.hzdPluginLitters_connection.nodes || [])

                // Automatically start editing the new litter
                handleEditClick(newLitter)
            }
        } catch (error) {
            console.error('Failed to create litter:', error)
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
    }

    if (litters.length === 0) {
        return <Typography>Keine Würfe gefunden.</Typography>
    }

    const canEditPuppies = editFormData?.LitterStatus === 'Littered'

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6'>Meine Würfe</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateLitter}
                    disabled={isCreating}
                    sx={{ bgcolor: '#facc15', color: 'black', '&:hover': { bgcolor: '#eab308' } }}
                >
                    {isCreating ? 'Wird angelegt...' : 'Neuen Wurf anlegen'}
                </Button>
            </Box>
            <TableContainer component={Paper} variant='outlined'>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>Wurf</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Datum</TableCell>
                            <TableCell align='right'>Aktionen</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {litters.map((litter) => {
                            let dateDisplay = '-'
                            if (litter.LitterStatus === 'Planned' && litter.plannedDateOfBirth) {
                                // Format: MM/YYYY
                                const date = new Date(litter.plannedDateOfBirth)
                                dateDisplay = date.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })
                            } else if (litter.LitterStatus === 'Manted' && litter.expectedDateOfBirth) {
                                // Format: DD.MM.YYYY
                                dateDisplay = formatDate(litter.expectedDateOfBirth)
                            } else if (litter.LitterStatus === 'Littered' && litter.dateOfBirth) {
                                // Format: DD.MM.YYYY
                                dateDisplay = formatDate(litter.dateOfBirth)
                            }

                            return (
                                <TableRow key={litter.documentId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">
                                        {litter.OrderLetter}-Wurf
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={litter.LitterStatus === 'Planned' ? 'Geplant' :
                                                litter.LitterStatus === 'Manted' ? 'Gedeckt' :
                                                    litter.LitterStatus === 'Littered' ? 'Geworfen' :
                                                        litter.LitterStatus === 'Closed' ? 'Abgeschlossen' : litter.LitterStatus}
                                            size='small'
                                            color={['Planned', 'Manted'].includes(litter.LitterStatus) ? 'default' : 'success'}
                                        />
                                    </TableCell>
                                    <TableCell>{dateDisplay}</TableCell>
                                    <TableCell align='right'>
                                        <Button
                                            variant='outlined'
                                            size='small'
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEditClick(litter)}
                                            disabled={!!editingLitterId}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {editingLitterId && editFormData && (() => {
                const currentLitter = litters.find(l => l.documentId === editingLitterId)
                return (
                    <Paper sx={{ mt: 4, p: 3, bgcolor: '#fffde7', border: '1px solid #facc15' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3 }}>
                            <Typography variant='h6' sx={{ whiteSpace: 'nowrap' }}>
                                Details bearbeiten
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, gap: 2, width: { xs: '100%', md: 'auto' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>Wurf:</Typography>
                                    <Select
                                        value={editFormData.OrderLetter}
                                        onChange={(e) => setEditFormData({ ...editFormData, OrderLetter: e.target.value })}
                                        size='small'
                                        sx={{ bgcolor: editFormData.LitterStatus === 'Planned' ? 'white' : 'action.disabledBackground', minWidth: 80 }}
                                        disabled={editFormData.LitterStatus !== 'Planned'}
                                    >
                                        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                                            <MenuItem key={letter} value={letter}>{letter}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>Status:</Typography>
                                    <Select
                                        value={editFormData.LitterStatus}
                                        onChange={(e) => setEditFormData({ ...editFormData, LitterStatus: e.target.value as any })}
                                        size='small'
                                        sx={{ bgcolor: 'white', minWidth: 150 }}
                                    >
                                        <MenuItem value="Planned">Geplant</MenuItem>
                                        <MenuItem value="Manted">Gedeckt</MenuItem>
                                        <MenuItem value="Littered">Geworfen</MenuItem>
                                        <MenuItem value="Closed">Geschlossen</MenuItem>
                                    </Select>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button startIcon={<CancelIcon />} onClick={handleCancelEdit} variant="outlined" color="inherit">Abbrechen</Button>
                                    <Button
                                        variant='contained'
                                        startIcon={<SaveIcon />}
                                        onClick={() => handleSave(editingLitterId)}
                                        disabled={isSaving || !!validationError}
                                        sx={{ bgcolor: '#facc15', color: 'black', '&:hover': { bgcolor: '#eab308' } }}
                                    >
                                        {isSaving ? 'Speichern...' : 'Speichern'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(255, 255, 255, 0.5)', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Mutter:</Typography>
                                    <Select
                                        fullWidth
                                        size='small'
                                        value={editFormData.mother || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, mother: e.target.value })}
                                        displayEmpty
                                        sx={{ bgcolor: editFormData.LitterStatus === 'Planned' ? 'white' : 'action.disabledBackground' }}
                                        disabled={editFormData.LitterStatus !== 'Planned'}
                                    >
                                        <MenuItem value=""><em>Keine ausgewählt</em></MenuItem>
                                        {breedingBitches.map((dog) => (
                                            <MenuItem key={dog.documentId} value={dog.documentId}>
                                                {dog.fullKennelName || dog.givenName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Vater (Deckrüde):</Typography>
                                    <Autocomplete
                                        fullWidth
                                        size='small'
                                        options={fatherOptions}
                                        getOptionLabel={(option) => option.fullKennelName || option.givenName || ''}
                                        value={selectedFather}
                                        onChange={(event, newValue) => {
                                            setSelectedFather(newValue)
                                            setEditFormData({ ...editFormData, stuntDog: newValue?.documentId || null })
                                        }}
                                        inputValue={fatherSearchInput}
                                        onInputChange={(event, newInputValue) => {
                                            setFatherSearchInput(newInputValue)
                                        }}
                                        loading={loadingFathers}
                                        readOnly={editFormData.LitterStatus !== 'Planned'}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                sx={{ bgcolor: editFormData.LitterStatus === 'Planned' ? 'white' : 'action.disabledBackground' }}
                                                placeholder="Zwingername suchen..."
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {loadingFathers ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        renderOption={(props, option) => {
                                            const { key, ...otherProps } = props
                                            return (
                                                <li key={key} {...otherProps}>
                                                    {option.fullKennelName || option.givenName}
                                                </li>
                                            )
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Geplantes Wurfdatum:</Typography>
                                    <TextField
                                        type="month"
                                        fullWidth
                                        size='small'
                                        sx={{ bgcolor: 'white' }}
                                        value={editFormData.plannedDateOfBirth ? editFormData.plannedDateOfBirth.substring(0, 7) : ''}
                                        onChange={(e) => {
                                            // Append day to make it YYYY-MM-DD
                                            const val = e.target.value ? `${e.target.value}-01` : null
                                            setEditFormData({ ...editFormData, plannedDateOfBirth: val })
                                        }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Erwartetes Wurfdatum:</Typography>
                                    <TextField
                                        type="date"
                                        fullWidth
                                        size='small'
                                        sx={{ bgcolor: editFormData.LitterStatus === 'Planned' ? 'action.disabledBackground' : 'white' }}
                                        value={editFormData.expectedDateOfBirth || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, expectedDateOfBirth: e.target.value || null })}
                                        disabled={editFormData.LitterStatus === 'Planned'}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Wurfdatum:</Typography>
                                    <TextField
                                        type="date"
                                        fullWidth
                                        size='small'
                                        sx={{ bgcolor: editFormData.LitterStatus === 'Planned' ? 'action.disabledBackground' : 'white' }}
                                        value={editFormData.dateOfBirth || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value || null })}
                                        disabled={editFormData.LitterStatus === 'Planned'}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {validationError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>
                        )}
                        {validationWarning && (
                            <Alert severity="warning" sx={{ mb: 2 }}>{validationWarning}</Alert>
                        )}

                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant='subtitle2'>Statusmeldung (Entwurf)</Typography>
                                {currentLitter?.StatusMessageDirtyFlag && (
                                    <Chip label="Freigabe steht aus" color="warning" size="small" />
                                )}
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                value={editFormData.StatusMessageDraft}
                                onChange={(e) => setEditFormData({ ...editFormData, StatusMessageDraft: e.target.value })}
                                variant="outlined"
                                sx={{ bgcolor: 'white' }}
                            />
                        </Box>

                        {!canEditPuppies && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Welpenzahlen können nur bearbeitet werden, wenn der Status "Geworfen" ist.
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Rüden Schwarz'
                                    value={editFormData.AmountRS}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountRS: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Hündinnen Schwarz'
                                    value={editFormData.AmountHS}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountHS: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Rüden Schwarzmarken'
                                    value={editFormData.AmountRSM}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountRSM: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Hündinnen Schwarzmarken'
                                    value={editFormData.AmountHSM}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountHSM: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Rüden Blond'
                                    value={editFormData.AmountRB}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountRB: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 300px' }}>
                                <PuppyAmountField
                                    label='Hündinnen Blond'
                                    value={editFormData.AmountHB}
                                    onChange={(val) => setEditFormData({ ...editFormData, AmountHB: val })}
                                    disabled={!canEditPuppies}
                                />
                            </Box>
                        </Box>
                    </Paper>
                )
            })()}
        </Box>
    )
}
