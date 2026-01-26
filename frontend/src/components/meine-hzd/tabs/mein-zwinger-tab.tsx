'use client'

import { useState } from 'react'
import { Box, Typography, TextField, Button, Avatar, Chip, Divider } from '@mui/material'
import type { Breeder } from '@/types'
import { fetchGraphQL } from '@/lib/graphql-client'
import { UPDATE_BREEDER } from '@/lib/graphql/mutations'

interface MeinZwingerTabProps {
    breeder: Breeder
    strapiBaseUrl?: string | null
}

export function MeinZwingerTab({ breeder, strapiBaseUrl }: MeinZwingerTabProps) {
    const [websiteUrlDraft, setWebsiteUrlDraft] = useState(breeder.WebsiteUrlDraft || '')
    // BreedersIntroDraft is now available in schema
    const [breederIntroDraft, setBreederIntroDraft] = useState(breeder.BreedersIntroDraft || '')

    const [address, setAddress] = useState({
        FullName: breeder.Address?.FullName || '',
        Address1: breeder.Address?.Address1 || '',
        Address2: breeder.Address?.Address2 || '',
        CountryCode: breeder.Address?.CountryCode || 'DE',
        Zip: breeder.Address?.Zip || '',
        City: breeder.Address?.City || '',
    })

    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleAddressChange = (field: keyof typeof address) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [field]: event.target.value })
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveMessage(null)

        try {
            await fetchGraphQL(UPDATE_BREEDER, {
                variables: {
                    documentId: breeder.documentId,
                    data: {
                        WebsiteUrlDraft: websiteUrlDraft,
                        BreedersIntroDraft: breederIntroDraft,
                        Address: address,
                    },
                },
                baseUrl: strapiBaseUrl,
            })
            setSaveMessage({ type: 'success', text: 'Änderungen erfolgreich gespeichert.' })
        } catch (error) {
            console.error('Failed to save breeder data:', error)
            setSaveMessage({ type: 'error', text: 'Fehler beim Speichern der Änderungen.' })
        } finally {
            setIsSaving(false)
        }
    }

    const isActive = breeder.IsActive && !breeder.Disable
    const avatarUrl = breeder.avatar?.url
        ? (strapiBaseUrl ? `${strapiBaseUrl}${breeder.avatar.url}` : breeder.avatar.url)
        : undefined

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3 }}>
                <Avatar
                    src={avatarUrl}
                    sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2rem' }}
                >
                    {breeder.kennelName?.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant='h5' gutterBottom>
                        Zwinger: {breeder.kennelName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                            label={isActive ? 'Aktiv' : 'Inaktiv'}
                            color={isActive ? 'success' : 'default'}
                            variant='outlined'
                        />
                        {breeder.isDirty && (
                            <Chip
                                label='Änderungen müssen noch freigegeben werden'
                                color='warning'
                                variant='filled'
                                sx={{ bgcolor: '#f59e0b', color: 'white' }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            <Typography variant='h6' sx={{ mb: 2, mt: 4 }}>Allgemeine Informationen</Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle2' color='text.secondary'>Webseite (Veröffentlicht)</Typography>
                <Typography variant='body1' sx={{ mb: 1 }}>{breeder.WebsiteUrl || '-'}</Typography>
                <TextField
                    label='Webseite (Entwurf)'
                    fullWidth
                    variant='outlined'
                    value={websiteUrlDraft}
                    onChange={(e) => setWebsiteUrlDraft(e.target.value)}
                    size='small'
                    helperText='Änderungen an der Webseite müssen erst freigegeben werden.'
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle2' color='text.secondary'>Persönliche Worte (Veröffentlicht)</Typography>
                <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap', mb: 2, border: '1px solid #eee', p: 1, borderRadius: 1, maxHeight: 100, overflow: 'auto' }}>
                    {breeder.BreedersIntroduction || '-'}
                </Typography>
                <TextField
                    label='Persönliche Worte (Entwurf)'
                    fullWidth
                    multiline
                    rows={4}
                    variant='outlined'
                    value={breederIntroDraft}
                    onChange={(e) => setBreederIntroDraft(e.target.value)}
                    helperText='Änderungen an der Persönlichen Worten müssen erst freigegeben werden.'
                />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' sx={{ mb: 2 }}>Mitgliedsadresse (Read-only)</Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant='body2' color='text.secondary'>Name</Typography>
                        <Typography variant='body1' gutterBottom>{breeder.member?.firstName} {breeder.member?.lastName}</Typography>

                        <Typography variant='body2' color='text.secondary'>Straße</Typography>
                        <Typography variant='body1' gutterBottom>{breeder.member?.address1 || '-'}</Typography>

                        <Typography variant='body2' color='text.secondary'>Ort</Typography>
                        <Typography variant='body1'>{breeder.member?.zip} {breeder.member?.city}</Typography>
                    </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' sx={{ mb: 2 }}>Zwingeradresse (Bearbeitbar)</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label='Name (Adresszusatz)'
                            value={address.FullName}
                            onChange={handleAddressChange('FullName')}
                            fullWidth
                            size='small'
                        />
                        <TextField
                            label='Straße'
                            value={address.Address1}
                            onChange={handleAddressChange('Address1')}
                            fullWidth
                            size='small'
                        />
                        <TextField
                            label='Adresszusatz'
                            value={address.Address2}
                            onChange={handleAddressChange('Address2')}
                            fullWidth
                            size='small'
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label='PLZ'
                                value={address.Zip}
                                onChange={handleAddressChange('Zip')}
                                sx={{ width: '100px' }}
                                size='small'
                            />
                            <TextField
                                label='Ort'
                                value={address.City}
                                onChange={handleAddressChange('City')}
                                fullWidth
                                size='small'
                            />
                        </Box>
                        <TextField
                            label='Ländercode'
                            value={address.CountryCode}
                            onChange={handleAddressChange('CountryCode')}
                            fullWidth
                            size='small'
                        />
                    </Box>
                </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{ bgcolor: '#facc15', color: 'black', '&:hover': { bgcolor: '#eab308' } }}
                >
                    {isSaving ? 'Speichere...' : 'Speichern'}
                </Button>
                {saveMessage && (
                    <Typography color={saveMessage.type === 'success' ? 'success.main' : 'error.main'}>
                        {saveMessage.text}
                    </Typography>
                )}
            </Box>
        </Box>
    )
}
