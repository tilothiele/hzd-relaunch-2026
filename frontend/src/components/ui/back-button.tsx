'use client'

import { Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { theme } from '@/themes'
import { cn } from '@/lib/utils'

interface BackButtonProps {
    onClick: () => void
    className?: string
}

/**
 * A reusable back button for detail views (e.g., Dog or Litter details).
 * Displays an arrow back icon and the text "Zurück zur Suchliste".
 */
export function BackButton({ onClick, className }: BackButtonProps) {
    return (
        <Button
            startIcon={<ArrowBackIcon />}
            onClick={onClick}
            variant="text"
            className={cn('transition-all duration-200 hover:scale-105', className)}
            sx={{
                color: theme.submitButtonColor,
                textTransform: 'none',
                fontWeight: 600,
                lineHeight: 1.5,
                // Ensure the icon matches the color
                '& .MuiButton-startIcon': {
                    marginRight: '8px'
                }
            }}
        >
            Zurück zur Suchliste
        </Button>
    )
}
