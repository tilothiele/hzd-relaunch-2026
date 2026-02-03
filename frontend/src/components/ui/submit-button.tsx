'use client'

import { Button, type SxProps, type Theme } from '@mui/material'
import { theme } from '@/themes'
import { ReactNode } from 'react'

interface SubmitButtonProps {
    /**
     * Whether the action is currently loading
     */
    isLoading?: boolean
    /**
     * Text to display on the button
     */
    label: string
    /**
     * Text or element to display when loading. Defaults to 'Laden...'
     */
    loadingLabel?: ReactNode
    /**
     * Click handler
     */
    onClick?: () => void
    /**
     * Button type (default: 'button')
     */
    type?: 'button' | 'submit'
    /**
     * Whether the button is disabled
     */
    disabled?: boolean
    /**
     * Whether the button should take full width
     */
    fullWidth?: boolean
    /**
     * Additional styles
     */
    sx?: SxProps<Theme>
}

export function SubmitButton({
    isLoading = false,
    label,
    loadingLabel = 'Laden...',
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false,
    sx = {},
}: SubmitButtonProps) {
    return (
        <Button
            type={type}
            variant='contained'
            onClick={onClick}
            disabled={isLoading || disabled}
            fullWidth={fullWidth}
            sx={{
                backgroundColor: theme.submitButtonColor,
                color: theme.submitButtonTextColor,
                borderRadius: '999px',
                transition: 'all 0.2s',
                '&:hover': {
                    backgroundColor: theme.buttonHoverColor,
                },
                '&:disabled': {
                    backgroundColor: '#d1d5db',
                    color: '#9ca3af',
                },
                ...sx,
            }}
        >
            {isLoading ? loadingLabel : label}
        </Button>
    )
}
