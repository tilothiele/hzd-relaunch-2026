'use client'

import { Box, Typography, Tooltip } from '@mui/material'
import type { Dog } from '@/types'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import FingerprintIcon from '@mui/icons-material/Fingerprint'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'

interface DogHealthTabProps {
    dog: Dog
}

export function DogHealthTab({ dog }: DogHealthTabProps) {
    const healthFields = [
        {
            label: 'HD',
            value: dog.HD ? dog.HD.toUpperCase() : '-',
            icon: <HealthAndSafetyIcon sx={{ color: '#059669' }} />,
            description: 'Hüftgelenksdysplasie'
        },
        {
            label: 'Genprofil (SOD1)',
            value: dog.SOD1 ? dog.SOD1.replace('_', '/') : '-',
            icon: <FingerprintIcon sx={{ color: '#2563eb' }} />,
            description: 'Genetisches Profil (SOD1)'
        },
        {
            label: 'Augenuntersuchung',
            value: dog.EyesCheck === true ? 'Ja' : dog.EyesCheck === false ? 'Nein' : '-',
            icon: <VisibilityIcon sx={{ color: '#7c3aed' }} />,
            description: 'Aktuelle Augenuntersuchung'
        },
        {
            label: 'Herzuntersuchung',
            value: dog.HeartCheck === true ? 'Ja' : dog.HeartCheck === false ? 'Nein' : '-',
            icon: <FavoriteIcon sx={{ color: '#dc2626' }} />,
            description: 'Aktuelle Herzuntersuchung'
        },
        {
            label: 'Farbcheck',
            value: dog.ColorCheck === true ? 'Ja' : dog.ColorCheck === false ? 'Nein' : '-',
            icon: <ColorLensIcon sx={{ color: '#d97706' }} />,
            description: 'Farbgenetik-Check'
        }
    ]

    return (
        <Box sx={{ p: 2 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {healthFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <Tooltip title={field.description} arrow>
                            <Box sx={{ 
                                display: 'flex', 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(0,0,0,0.03)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                flexShrink: 0
                            }}>
                                {field.icon}
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                {field.label}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                {field.value}
                                {field.value === 'Ja' && <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#059669' }} />}
                                {field.value === 'Nein' && <HighlightOffIcon sx={{ fontSize: 18, color: '#dc2626' }} />}
                            </Typography>
                        </Box>
                    </div>
                ))}
            </div>
        </Box>
    )
}
