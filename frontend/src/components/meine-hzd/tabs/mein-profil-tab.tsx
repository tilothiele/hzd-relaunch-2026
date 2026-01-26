import { Box, Typography } from '@mui/material'

export function MeinProfilTab() {
    return (
        <Box>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
                Profil-Informationen werden hier verwaltet.
            </Typography>
            <Box
                component='ul'
                sx={{
                    listStyleType: 'disc',
                    pl: 4,
                    mb: 0,
                    '& li': {
                        mb: 1.5,
                        fontSize: '1rem',
                        color: 'text.primary',
                    },
                }}
            >
                <Box component='li'>Persönliche Daten (Name, E-Mail, Telefon, Adresse)</Box>
                <Box component='li'>Passwort ändern (für den Login)</Box>
                <Box component='li'>Kontoverbindung / SEPA-Mandat (für die Zahlung)</Box>
            </Box>
        </Box>
    )
}
