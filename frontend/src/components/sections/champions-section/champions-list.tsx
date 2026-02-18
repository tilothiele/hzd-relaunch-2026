'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ThemeDefinition } from '@/themes'
import type { HzdSetting } from '@/types'
import { getMoreChampions } from '@/lib/server/champion-actions'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { Avatar, Box, CircularProgress, Typography, Dialog, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { BlocksRenderer } from '@strapi/blocks-react-renderer'

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
                    {/* Tailwind CSS Table */}
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full text-left border-collapse" aria-label={`Champions ${year}`}>
                            <thead>
                                <tr className="border-b" style={{ borderColor: theme.buttonColor }}>
                                    <th className="p-2 font-bold" style={{ color: theme.textColor }}>Bild</th>
                                    <th className="p-2 font-bold" style={{ color: theme.textColor }}>Hund/Titel</th>
                                    <th className="p-2 font-bold" style={{ color: theme.textColor }}>Züchter</th>
                                    <th className="p-2 font-bold" style={{ color: theme.textColor }}>Besitzer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedChampions[year].map((champion: any, index: number) => {
                                    const dogName = champion.hzd_plugin_dog?.fullKennelName
                                        ? `${champion.hzd_plugin_dog.givenName} ${champion.hzd_plugin_dog.fullKennelName}`
                                        : (champion.hzd_plugin_dog?.givenName || 'Unbekannter Name')

                                    return (
                                        <tr
                                            key={champion.documentId}
                                            style={{
                                                backgroundColor: index % 2 === 0 ? theme.cardsBackground : 'white'
                                            }}
                                        >
                                            <td className="w-[144px] p-0 align-top leading-none">
                                                <div
                                                    className="w-[144px] h-[108px] cursor-pointer block relative overflow-hidden"
                                                    onClick={() => {
                                                        const url = getAvatarUrl(champion)
                                                        if (url) setSelectedImage(url)
                                                    }}
                                                >
                                                    {/* Using standard img for absolute control or keeping Avatar if it behaves */}
                                                    <Avatar
                                                        src={getAvatarUrl(champion)}
                                                        alt={dogName}
                                                        sx={{ width: 144, height: 108 }}
                                                        variant="square"
                                                        imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%', display: 'block' } }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 pr-2 pl-6 align-top">
                                                <div className="text-[1.1rem] font-bold" style={{ color: theme.textColor }}>
                                                    {dogName}
                                                </div>
                                                <div className="text-[0.9rem]" style={{ color: theme.textColor }}>
                                                    {champion.ChampionshipTitles ? (
                                                        <BlocksRenderer content={champion.ChampionshipTitles} />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top" style={{ color: theme.textColor }}>
                                                {champion.hzd_plugin_dog?.breeder?.kennelName || '-'}
                                                {champion.hzd_plugin_dog?.breeder?.member && (
                                                    <div className="text-[0.85rem] opacity-80">
                                                        {`${champion.hzd_plugin_dog.breeder.member.firstName || ''} ${champion.hzd_plugin_dog.breeder.member.lastName || ''}`}
                                                        {champion.hzd_plugin_dog.breeder.member.city && `, ${champion.hzd_plugin_dog.breeder.member.city}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 align-top" style={{ color: theme.textColor }}>
                                                {champion.hzd_plugin_dog?.owner ? (
                                                    <>
                                                        {`${champion.hzd_plugin_dog.owner.firstName || ''} ${champion.hzd_plugin_dog.owner.lastName || ''}`}
                                                        {champion.hzd_plugin_dog.owner.city && `, ${champion.hzd_plugin_dog.owner.city}`}
                                                    </>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
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
