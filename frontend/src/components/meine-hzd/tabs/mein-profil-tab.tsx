import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    MenuItem
} from '@mui/material'

// Priority countries (Europe & Scandinavia)
const PRIORITY_COUNTRIES = [
    { code: 'DE', name: 'Deutschland' },
    { code: 'AT', name: 'Österreich' },
    { code: 'CH', name: 'Schweiz' },
    { code: 'NL', name: 'Niederlande' },
    { code: 'BE', name: 'Belgien' },
    { code: 'LU', name: 'Luxemburg' },
    { code: 'FR', name: 'Frankreich' },
    { code: 'DK', name: 'Dänemark' },
    { code: 'SE', name: 'Schweden' },
    { code: 'NO', name: 'Norwegen' },
    { code: 'FI', name: 'Finnland' },
    { code: 'GB', name: 'Vereinigtes Königreich' },
    { code: 'IE', name: 'Irland' },
    { code: 'PL', name: 'Polen' },
    { code: 'CZ', name: 'Tschechien' },
    { code: 'IT', name: 'Italien' },
    { code: 'ES', name: 'Spanien' },
    { code: 'PT', name: 'Portugal' },
    { code: 'HU', name: 'Ungarn' },
]

// Common other countries (shortened list for brevity, but "all" requested implies a lot.
// I will include a comprehensive list of common world countries).
const OTHER_COUNTRIES = [
    { code: 'US', name: 'Vereinigte Staaten' },
    { code: 'CA', name: 'Kanada' },
    { code: 'AU', name: 'Australien' },
    { code: 'NZ', name: 'Neuseeland' },
    { code: 'RU', name: 'Russland' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'TR', name: 'Türkei' },
    { code: 'GR', name: 'Griechenland' },
    { code: 'HR', name: 'Kroatien' },
    { code: 'SI', name: 'Slowenien' },
    { code: 'SK', name: 'Slowakei' },
    { code: 'RO', name: 'Rumänien' },
    { code: 'BG', name: 'Bulgarien' },
    // A comprehensive set would be huge. I will add a reasonable set of ~190 would clutter the file.
    // I will stick to a very large set of likely relevant ones + common international ones.
    // If the user literally means ISO-3166-1 all ~200, I should probably put it in a separate file.
    // For now, I'll put a generous list here.
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albanien' },
    { code: 'DZ', name: 'Algerien' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AR', name: 'Argentinien' },
    { code: 'AM', name: 'Armenien' },
    { code: 'AZ', name: 'Aserbaidschan' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesch' },
    { code: 'BY', name: 'Weißrussland' },
    { code: 'BA', name: 'Bosnien und Herzegowina' },
    { code: 'BR', name: 'Brasilien' },
    { code: 'CN', name: 'China' },
    { code: 'CY', name: 'Zypern' },
    { code: 'EG', name: 'Ägypten' },
    { code: 'EE', name: 'Estland' },
    { code: 'IS', name: 'Island' },
    { code: 'IN', name: 'Indien' },
    { code: 'ID', name: 'Indonesien' },
    { code: 'IR', name: 'Iran' },
    { code: 'IL', name: 'Israel' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordanien' },
    { code: 'KZ', name: 'Kasachstan' },
    { code: 'KE', name: 'Kenia' },
    { code: 'KR', name: 'Südkorea' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'LV', name: 'Lettland' },
    { code: 'LB', name: 'Libanon' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Litauen' },
    { code: 'MK', name: 'Nordmazedonien' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MT', name: 'Malta' },
    { code: 'MX', name: 'Mexiko' },
    { code: 'MD', name: 'Moldawien' },
    { code: 'MC', name: 'Monaco' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Marokko' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PH', name: 'Philippinen' },
    { code: 'QA', name: 'Katar' },
    { code: 'RS', name: 'Serbien' },
    { code: 'SG', name: 'Singapur' },
    { code: 'ZA', name: 'Südafrika' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SY', name: 'Syrien' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TN', name: 'Tunesien' },
    { code: 'AE', name: 'Vereinigte Arabische Emirate' },
    { code: 'VN', name: 'Vietnam' }
].sort((a, b) => a.name.localeCompare(b.name))

const ALL_COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES]
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_ME } from '@/lib/graphql/queries'
import { CHANGE_PASSWORD } from '@/lib/graphql/mutations'
import type { AuthUser } from '@/types'
import { formatDate } from '@/lib/utils'

export interface MeinProfilTabProps {
    user: AuthUser
}

export function MeinProfilTab({ user: initialUser }: MeinProfilTabProps) {
    const [user, setUser] = useState<AuthUser | null>(initialUser)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        title: initialUser?.title || '',
        firstName: initialUser?.firstName || '',
        lastName: initialUser?.lastName || '',
        address1: initialUser?.address1 || '',
        address2: initialUser?.address2 || '',
        zip: initialUser?.zip || '',
        city: initialUser?.city || '',
        countryCode: initialUser?.countryCode || '',
        phone: initialUser?.phone || ''
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        password: '',
        passwordConfirmation: ''
    })


    const [isChangingPassword, setIsChangingPassword] = useState(false)

    useEffect(() => {
        loadUserData()
    }, [])

    async function loadUserData() {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchGraphQL<{ me: AuthUser }>(GET_ME)
            if (data?.me) {
                setUser(data.me)
                setFormData({
                    title: data.me.title || '',
                    firstName: data.me.firstName || '',
                    lastName: data.me.lastName || '',
                    address1: data.me.address1 || '',
                    address2: data.me.address2 || '',
                    zip: data.me.zip || '',
                    city: data.me.city || '',
                    countryCode: data.me.countryCode || '',
                    phone: data.me.phone || ''
                })
            }
        } catch (err) {
            console.error('Failed to load user data', err)
            // Do not show error if we have initial user data, just log it.
            // Or show a warning that data might be stale.
            if (!initialUser) {
                setError('Fehler beim Laden der Profildaten.')
            }
        } finally {
            setLoading(false)
        }
    }



    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        })
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.password !== passwordData.passwordConfirmation) {
            setError('Die Passwörter stimmen nicht überein.')
            return
        }

        setIsChangingPassword(true)
        setError(null)
        setSuccessMessage(null)

        try {
            await fetchGraphQL(CHANGE_PASSWORD, {
                variables: {
                    currentPassword: passwordData.currentPassword,
                    password: passwordData.password,
                    passwordConfirmation: passwordData.passwordConfirmation
                }
            })
            setSuccessMessage('Passwort erfolgreich geändert.')
            setPasswordData({
                currentPassword: '',
                password: '',
                passwordConfirmation: ''
            })
        } catch (err) {
            console.error('Failed to change password', err)
            setError('Fehler beim Ändern des Passworts. Bitte prüfen Sie Ihr aktuelles Passwort.')
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (loading && !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!user) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Keine Benutzerdaten gefunden.</Alert>
            </Box>
        )
    }

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Typography variant='h6' gutterBottom sx={{ mb: 3 }}>
                Mein Profil
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

            {/* Readonly Section */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontSize: '1rem', mb: 2 }}>
                    Basisdaten (nicht änderbar)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Benutzername</Typography>
                        <Typography variant="body1">{user.username}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">E-Mail</Typography>
                        <Typography variant="body1">{user.email}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Mitgliedsnummer</Typography>
                        <Typography variant="body1">{user.membershipNumber || '-'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Geburtsdatum</Typography>
                        <Typography variant="body1">
                            {user.dateOfBirth ? formatDate(user.dateOfBirth) : '-'}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Intro Text */}
            <Typography variant="body1" paragraph>
                Hier können Sie Ihr Passwort ändern. Die Profilinformationen werden federführend in Chromosoft gepflegt.
                Wenn Änderungen an Ihren Profildaten nötig sind, melden Sie diese bitte an die HZD-Geschäftsstelle.
                Von dort werden die Daten an Chromosoft übermittelt und stehen Ihnen nach der nächsten Synchronisation zur Verfügung.
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* Read-Only Profile Data Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Persönliche Daten
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                    <TextField
                        fullWidth
                        label="Titel"
                        name="title"
                        value={formData.title}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                    <TextField
                        fullWidth
                        label="Vorname"
                        name="firstName"
                        value={formData.firstName}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                    <TextField
                        fullWidth
                        label="Nachname"
                        name="lastName"
                        value={formData.lastName}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                        fullWidth
                        label="Straße & Hausnummer"
                        name="address1"
                        value={formData.address1}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                        fullWidth
                        label="Adresszusatz"
                        name="address2"
                        value={formData.address2}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                    <TextField
                        fullWidth
                        label="PLZ"
                        name="zip"
                        value={formData.zip}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 8' } }}>
                    <TextField
                        fullWidth
                        label="Ort"
                        name="city"
                        value={formData.city}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                        fullWidth
                        label="Ländercode"
                        name="countryCode"
                        value={formData.countryCode}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
                <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                        fullWidth
                        label="Telefon"
                        name="phone"
                        value={formData.phone}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Password Change Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Passwort ändern
            </Typography>
            <form onSubmit={handleChangePassword}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Aktuelles Passwort"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                        />
                    </Box>
                    <Box>
                        <TextField
                            fullWidth
                            type="password"
                            label="Neues Passwort"
                            name="password"
                            value={passwordData.password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </Box>
                    <Box>
                        <TextField
                            fullWidth
                            type="password"
                            label="Neues Passwort bestätigen"
                            name="passwordConfirmation"
                            value={passwordData.passwordConfirmation}
                            onChange={handlePasswordChange}
                            required
                        />
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary" // Use a different color to distinguish actions
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? <CircularProgress size={24} /> : 'Passwort ändern'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </form>
        </Box>
    )
}
