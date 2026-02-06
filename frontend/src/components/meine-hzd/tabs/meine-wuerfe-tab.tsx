'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Button, Grid, TextField, CircularProgress, Chip, Alert, MenuItem, Select } from '@mui/material'
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import type { Breeder, Litter, LitterSearchResult } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_LITTERS_BY_BREEDER } from '@/lib/graphql/queries'
import { UPDATE_LITTER } from '@/lib/graphql/mutations'
import { formatDate } from '@/lib/utils'

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
    const [validationError, setValidationError] = useState<string | null>(null)
    const [validationWarning, setValidationWarning] = useState<string | null>(null)

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
            AmountRS: { Total: litter.AmountRS?.Total || 0, Available: litter.AmountRS?.Available || 0 },
            AmountRSM: { Total: litter.AmountRSM?.Total || 0, Available: litter.AmountRSM?.Available || 0 },
            AmountRB: { Total: litter.AmountRB?.Total || 0, Available: litter.AmountRB?.Available || 0 },
            AmountHS: { Total: litter.AmountHS?.Total || 0, Available: litter.AmountHS?.Available || 0 },
            AmountHSM: { Total: litter.AmountHSM?.Total || 0, Available: litter.AmountHSM?.Available || 0 },
            AmountHB: { Total: litter.AmountHB?.Total || 0, Available: litter.AmountHB?.Available || 0 },
        })
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
            await fetchGraphQL(UPDATE_LITTER, {
                variables: {
                    documentId: litterId,
                    data: editFormData
                },
                baseUrl: strapiBaseUrl
            })

            // Update local state
            setLitters(litters.map(l => l.documentId === litterId ? { ...l, ...editFormData } as any : l))

            setEditingLitterId(null)
            setEditFormData(null)
        } catch (error) {
            console.error('Failed to save litter:', error)
        } finally {
            setIsSaving(false)
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
            <Typography variant='h6' gutterBottom>Meine Würfe</Typography>
            <TableContainer component={Paper} variant='outlined'>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>Wurf</TableCell>
                            <TableCell>Wurfdatum</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align='right'>Aktionen</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {litters.map((litter) => (
                            <TableRow key={litter.documentId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">
                                    {litter.OrderLetter}-Wurf
                                </TableCell>
                                <TableCell>{formatDate(litter.dateOfBirth) || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={litter.LitterStatus}
                                        size='small'
                                        color={['Planned', 'Manted'].includes(litter.LitterStatus) ? 'default' : 'success'}
                                    />
                                </TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {editingLitterId && editFormData && (() => {
                const currentLitter = litters.find(l => l.documentId === editingLitterId)
                return (
                    <Paper sx={{ mt: 4, p: 3, bgcolor: '#fffde7', border: '1px solid #facc15' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3 }}>
                            <Typography variant='h6' sx={{ whiteSpace: 'nowrap' }}>
                                Details bearbeiten ({currentLitter?.OrderLetter}-Wurf)
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, gap: 2, width: { xs: '100%', md: 'auto' } }}>
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
                                    <Typography variant="subtitle2" color="text.secondary">Mutter:</Typography>
                                    <Typography variant="body2">{currentLitter?.mother?.fullKennelName || '-'}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Vater (Deckrüde):</Typography>
                                    <Typography variant="body2">{currentLitter?.stuntDog?.fullKennelName || '-'}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Deckdatum:</Typography>
                                    <Typography variant="body2">{formatDate(currentLitter?.dateOfManting) || '-'}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Erwartetes Wurfdatum:</Typography>
                                    <Typography variant="body2">{formatDate(currentLitter?.expectedDateOfBirth) || '-'}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Wurfdatum:</Typography>
                                    <Typography variant="body2">{formatDate(currentLitter?.dateOfBirth) || '-'}</Typography>
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
