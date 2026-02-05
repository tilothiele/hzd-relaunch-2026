'use client'

import { Box, Switch } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { theme } from '@/themes'

interface ViewToggleProps {
    viewMode: 'cards' | 'table'
    onViewModeChange: (mode: 'cards' | 'table') => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GridViewIcon
                sx={{
                    fontSize: 20,
                    color: viewMode === 'cards' ? theme.submitButtonColor : 'text.disabled'
                }}
            />
            <Switch
                size='small'
                checked={viewMode === 'table'}
                onChange={(e) => onViewModeChange(e.target.checked ? 'table' : 'cards')}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.submitButtonColor,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: theme.submitButtonColor,
                    },
                }}
            />
            <TableRowsIcon
                sx={{
                    fontSize: 20,
                    color: viewMode === 'table' ? theme.submitButtonColor : 'text.disabled'
                }}
            />
        </Box>
    )
}
