'use client'

import { Box, Typography } from '@mui/material'
import Link from 'next/link'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import type { TableOfContentSection } from '@/types'
import type { ThemeDefinition } from '@/themes'

interface TableOfContentSectionProps {
    section: TableOfContentSection
    theme: ThemeDefinition
}

export function TableOfContentSectionComponent({ section, theme }: TableOfContentSectionProps) {
    const links = section.TocLink || []

    if (!links.length && !section.TocHeadline) {
        return null
    }

    return (
        <Box
            component='section'
            sx={{
                py: 4,
                px: 2,
                backgroundColor: theme.evenBgColor,
                color: theme.textColor,
            }}
        >
            <div className='container mx-auto max-w-4xl'>
                {section.TocHeadline && (
                    <Typography
                        variant='h4'
                        component='h2'
                        align='center'
                        sx={{
                            mb: 4,
                            fontWeight: 'bold',
                            color: theme.headlineColor,
                        }}
                    >
                        {section.TocHeadline}
                    </Typography>
                )}

                {links.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        {links.map((link, index) => {
                            if (!link?.Link || !link?.Label) return null

                            return (
                                <Link
                                    key={index}
                                    href={link.Link}
                                    className='text-lg font-medium hover:underline'
                                    style={{
                                        color: theme.submitButtonColor,
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <KeyboardArrowRightIcon fontSize='small' />
                                    {link.Label}
                                </Link>
                            )
                        })}
                    </Box>
                )}
            </div>
        </Box>
    )
}
