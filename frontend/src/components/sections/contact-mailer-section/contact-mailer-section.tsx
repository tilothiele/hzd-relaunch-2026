'use client'

import { useState, useEffect } from 'react'
import { TextField, Button, MenuItem, Select, FormControl, InputLabel, Box, Alert, CircularProgress, Typography, Checkbox, FormControlLabel } from '@mui/material'
import type { ContactMailerSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { useAuth } from '@/hooks/use-auth'
import { SubmitButton } from '@/components/ui/submit-button'

interface ContactMailerSectionComponentProps {
    section: ContactMailerSection
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function ContactMailerSectionComponent({
    section,
    theme,
}: ContactMailerSectionComponentProps) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        subject: '',
        message: '',
        sendCopy: false,
    })

    const subjectLimit = parseInt(process.env.NEXT_PUBLIC_CONTACT_FORM_SUBJECT_MAX_LENGTH || '200')
    const messageLimit = parseInt(process.env.NEXT_PUBLIC_CONTACT_FORM_MESSAGE_MAX_LENGTH || '2000')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Recipient options from dynamic zone section
    const recipients = section.ReceipientOptions || []

    useEffect(() => {
        if (user?.email) {
            setFormData((prev) => ({ ...prev, from: user.email! }))
        }
    }, [user])

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setErrorMessage('')

        try {
            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || 'Fehler beim Senden der Nachricht.')
            }

            setStatus('success')
            setFormData((prev) => ({ ...prev, subject: '', message: '' }))

            // Reset success message after 5 seconds
            setTimeout(() => setStatus('idle'), 5000)
        } catch (error: any) {
            setStatus('error')
            setErrorMessage(error.message || 'Ein unerwarteter Fehler ist aufgetreten.')
        }
    }

    return (
        <SectionContainer
            variant='max-width'
            id={section.ContactMailerAnchor || undefined}
            backgroundColor={theme.evenBgColor}
            paddingTop='2em'
            paddingBottom='2em'
        >
            <Box sx={{ width: '100%', mx: 'auto' }}>
                {section.ContactMailerHeadline && (
                    <h2 className='text-4xl font-bold mb-4 text-center' style={{ color: theme.textColor }}>{section.ContactMailerHeadline}</h2>
                )}

                {section.ContactMailerInfotext && (
                    <Typography
                        variant="body1"
                        component="div"
                        sx={{ mb: 4, textAlign: 'center', color: theme.textColor, maxWidth: 800, mx: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: section.ContactMailerInfotext }}
                    />
                )}

                <Box sx={{
                    p: { xs: 3, md: 6 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 2,
                    width: '100%'
                }}>
                    {status === 'success' && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Ihre Nachricht wurde erfolgreich versendet!
                        </Alert>
                    )}

                    {status === 'error' && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <TextField
                                label="Ihre E-Mail Adresse"
                                name="from"
                                type="email"
                                value={formData.from}
                                onChange={handleChange}
                                required
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': { color: theme.textColor },
                                    '& .MuiInputLabel-root': { color: theme.textColor },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                }}
                            />

                            <FormControl fullWidth required sx={{
                                '& .MuiInputBase-root': { color: theme.textColor },
                                '& .MuiInputLabel-root': { color: theme.textColor },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                            }}>
                                <InputLabel id="recipient-label">Empfänger</InputLabel>
                                <Select
                                    labelId="recipient-label"
                                    name="to"
                                    value={formData.to}
                                    onChange={handleChange}
                                    label="Empfänger"
                                >
                                    {recipients.map((option) => (
                                        <MenuItem key={option.id} value={option.Email}>
                                            {option.DisplayName || option.Email}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                <TextField
                                    label="Betreff"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    inputProps={{ maxLength: subjectLimit }}
                                    helperText={`${formData.subject.length} / ${subjectLimit}`}
                                    sx={{
                                        '& .MuiInputBase-root': { color: theme.textColor },
                                        '& .MuiInputLabel-root': { color: theme.textColor },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                        '& .MuiFormHelperText-root': { color: theme.textColor },
                                    }}
                                />
                            </Box>

                            <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                <TextField
                                    label="Nachricht"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    multiline
                                    rows={6}
                                    inputProps={{ maxLength: messageLimit }}
                                    helperText={`${formData.message.length} / ${messageLimit}`}
                                    sx={{
                                        '& .MuiInputBase-root': { color: theme.textColor },
                                        '& .MuiInputLabel-root': { color: theme.textColor },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.textColor },
                                        '& .MuiFormHelperText-root': { color: theme.textColor },
                                    }}
                                />
                            </Box>

                            <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="sendCopy"
                                            checked={formData.sendCopy}
                                            onChange={handleChange}
                                            sx={{
                                                color: theme.submitButtonColor,
                                                '&.Mui-checked': {
                                                    color: theme.submitButtonColor,
                                                },
                                            }}
                                        />
                                    }
                                    label="Mir eine Kopie senden"
                                    sx={{ color: theme.textColor }}
                                />
                            </Box>

                            <Box sx={{ gridColumn: { md: 'span 2' }, display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <SubmitButton
                                    type="submit"
                                    label="Nachricht senden"
                                    loadingLabel={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={20} color="inherit" />
                                            <span>Senden...</span>
                                        </Box>
                                    }
                                    isLoading={status === 'loading'}
                                    sx={{
                                        px: 10,
                                        py: 1.5,
                                        fontWeight: 700,
                                    }}
                                />
                            </Box>
                        </Box>
                    </form>
                </Box>
            </Box>
        </SectionContainer>
    )
}
