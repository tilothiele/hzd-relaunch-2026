'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ThemeDefinition } from '@/themes'
import type { HzdSetting } from '@/types'
import { getMoreChampions } from '@/lib/server/champion-actions'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { Avatar, Box, CircularProgress, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface ChampionsListProps {
    initialChampions: any[]
    theme: ThemeDefinition
    strapiBaseUrl: string
    hzdSetting?: HzdSetting | null
}

export function ChampionsList({
    initialChampions,
    theme,
    strapiBaseUrl,
    hzdSetting
}: ChampionsListProps) {
    const [champions, setChampions] = useState<any[]>(initialChampions)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const observer = useRef<IntersectionObserver | null>(null)

    const lastChampionElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, hasMore])

    useEffect(() => {
        if (page === 1) return

        const loadMore = async () => {
            setLoading(true)
            const newChampions = await getMoreChampions(page, 20)
            if (newChampions.length === 0) {
                setHasMore(false)
            } else {
                setChampions(prev => [...prev, ...newChampions])
            }
            setLoading(false)
        }

        loadMore()
    }, [page])

    const getAvatarUrl = (champion: any) => {
        const championAvatar = champion.ChampinAvatar
        if (championAvatar) return resolveMediaUrl(championAvatar, strapiBaseUrl) || undefined

        const dogAvatar = champion.hzd_plugin_dog?.avatar
        if (dogAvatar) return resolveMediaUrl(dogAvatar, strapiBaseUrl) || undefined

        const defaultAvatar = hzdSetting?.DefaultChanpionAvatar
        return resolveMediaUrl(defaultAvatar, strapiBaseUrl) || undefined
    }

    const groupedChampions = champions.reduce((groups: any, champion: any) => {
        const year = new Date(champion.DateOfChampionship).getFullYear()
        if (!groups[year]) {
            groups[year] = []
        }
        groups[year].push(champion)
        return groups
    }, {})

    // Sort years descending
    const sortedYears = Object.keys(groupedChampions).sort((a, b) => parseInt(b) - parseInt(a))

    return (
        <Box sx={{ width: '100%' }}>
            {sortedYears.map(year => (
                <Box key={year} sx={{ mb: 4 }}>
                    <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                            borderBottom: `2px solid ${theme.buttonColor}`,
                            pb: 1,
                            mb: 2,
                            color: theme.headlineColor,
                            fontWeight: 'bold'
                        }}
                    >
                        {year}
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                        <Table sx={{ minWidth: 650 }} aria-label={`Champions ${year}`}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: theme.textColor, fontWeight: 'bold' }}>Bild</TableCell>
                                    <TableCell sx={{ color: theme.textColor, fontWeight: 'bold' }}>Hund/Titel</TableCell>
                                    <TableCell sx={{ color: theme.textColor, fontWeight: 'bold' }}>Züchter</TableCell>
                                    <TableCell sx={{ color: theme.textColor, fontWeight: 'bold' }}>Besitzer</TableCell>
                                    <TableCell sx={{ color: theme.textColor, fontWeight: 'bold' }}>Datum</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {groupedChampions[year].map((champion: any, index: number) => {
                                    const dogName = champion.hzd_plugin_dog?.fullKennelName
                                        ? `${champion.hzd_plugin_dog.givenName} ${champion.hzd_plugin_dog.fullKennelName}`
                                        : (champion.hzd_plugin_dog?.givenName || 'Unbekannter Name')

                                    const formattedDate = champion.DateOfChampionship
                                        ? new Date(champion.DateOfChampionship).toLocaleDateString('de-DE')
                                        : 'Kein Datum'

                                    return (
                                        <TableRow
                                            key={champion.documentId}
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                bgcolor: index % 2 === 0 ? theme.cardsBackground : 'white'
                                            }}
                                        >
                                            <TableCell sx={{ p: 0, width: 120 }}>
                                                <Avatar
                                                    src={getAvatarUrl(champion)}
                                                    alt={dogName}
                                                    sx={{ width: 120, height: 90, cursor: 'pointer' }}
                                                    variant="square"
                                                    onClick={() => {
                                                        const url = getAvatarUrl(champion)
                                                        if (url) setSelectedImage(url)
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ color: theme.textColor, fontSize: '1.1rem', fontWeight: 'bold' }}>
                                                    {dogName}
                                                </Typography>
                                                <Typography sx={{ color: theme.textColor, fontSize: '0.9rem' }}>
                                                    {champion.ChampionshipName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: theme.textColor }}>
                                                {champion.hzd_plugin_dog?.breeder?.kennelName || '-'}
                                                {champion.hzd_plugin_dog?.breeder?.member && (
                                                    <Typography component="div" variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                                        {`${champion.hzd_plugin_dog.breeder.member.firstName || ''} ${champion.hzd_plugin_dog.breeder.member.lastName || ''}`}
                                                        {champion.hzd_plugin_dog.breeder.member.city && `, ${champion.hzd_plugin_dog.breeder.member.city}`}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.textColor }}>
                                                {champion.hzd_plugin_dog?.owner ? (
                                                    <>
                                                        {`${champion.hzd_plugin_dog.owner.firstName || ''} ${champion.hzd_plugin_dog.owner.lastName || ''}`}
                                                        {champion.hzd_plugin_dog.owner.city && `, ${champion.hzd_plugin_dog.owner.city}`}
                                                    </>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.textColor }}>
                                                {formattedDate}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}

            <div ref={lastChampionElementRef} style={{ height: '20px', marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                {loading && (
                    <CircularProgress sx={{ color: theme.buttonColor }} />
                )}
            </div>
            {!hasMore && champions.length > 0 && (
                <Typography align="center" sx={{ mt: 2, color: theme.textColor, opacity: 0.7 }}>
                    Alle Champions geladen.
                </Typography>
            )}
            {champions.length === 0 && !loading && (
                <Typography align="center" sx={{ mt: 2, color: theme.textColor }}>
                    Keine Champions gefunden.
                </Typography>
            )}

            <Dialog
                open={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'visible'
                    }
                }}
            >
                <Box sx={{ position: 'relative' }}>
                    <IconButton
                        onClick={() => setSelectedImage(null)}
                        sx={{
                            position: 'absolute',
                            right: -40,
                            top: -40,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Champion Full Size"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                display: 'block',
                                borderRadius: '8px'
                            }}
                        />
                    )}
                </Box>
            </Dialog>
        </Box>
    )
}
