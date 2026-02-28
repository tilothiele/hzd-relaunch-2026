
'use client'

import { useEffect, useState } from 'react'
import { Snackbar, Alert, Button, Box, Typography, IconButton, Collapse } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import InfoIcon from '@mui/icons-material/Info'
import RefreshIcon from '@mui/icons-material/Refresh'

export function PwaUpdater() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
    const [showUpdate, setShowUpdate] = useState(false)
    const [showInstructions, setShowInstructions] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [currentVersion] = useState(process.env.NEXT_PUBLIC_APP_VERSION || 'unbekannt')
    const [availableVersion, setAvailableVersion] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent)
            const getVersionFromWorker = (worker: ServiceWorker) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    if (event.data && event.data.version) {
                        setAvailableVersion(event.data.version);
                    }
                };
                worker.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
            };

            // Get existing registration
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) {
                    setRegistration(reg)

                    // Check if there is already a waiting worker
                    if (reg.waiting) {
                        setShowUpdate(true)
                        getVersionFromWorker(reg.waiting);
                    }

                    // Listen for new updates discovered during this session
                    const onUpdateFound = () => {
                        const newWorker = reg.installing
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setShowUpdate(true)
                                    getVersionFromWorker(newWorker);
                                }
                            })
                        }
                    }

                    reg.addEventListener('updatefound', onUpdateFound)
                }
            })

            // Event listener for when the service worker actually takes control (after skipWaiting)
            let refreshing = false
            const onControllerChange = () => {
                if (!refreshing) {
                    refreshing = true
                    window.location.reload()
                }
            }

            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
            }
        }
    }, [])

    const handleUpdate = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        } else {
            // Fallback for cases where waiting might be lost but we know there's an update
            window.location.reload()
        }
    }

    const handleClose = () => {
        setShowUpdate(false)
    }

    if (!showUpdate) return null

    return (
        <Snackbar
            open={showUpdate}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{
                bottom: { xs: 'calc(env(safe-area-inset-bottom) + 80px)', sm: 32 },
                zIndex: 11000,
                width: { xs: '90vw', sm: 'auto' }
            }}
        >
            <Alert
                severity="info"
                variant="filled"
                icon={<RefreshIcon sx={{ color: 'white' }} />}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                            color="inherit"
                            variant="outlined"
                            size="small"
                            onClick={handleUpdate}
                            sx={{
                                fontWeight: 'bold',
                                borderColor: 'rgba(255,255,255,0.5)',
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Aktualisieren
                        </Button>
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleClose}
                            sx={{ opacity: 0.7 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
                sx={{
                    width: '100%',
                    backgroundColor: '#4560AA',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    '& .MuiAlert-message': { width: '100%' }
                }}
            >
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Neue Version verfügbar!
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Ein Update für die HZD App ist bereit.
                        <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem', opacity: 0.8 }}>
                            Aktuell: v{currentVersion} &rarr; Neu: v{availableVersion || '...'}
                        </Box>
                        <Box component="span" sx={{ display: 'block', mt: 0.2, fontSize: '0.7rem', opacity: 0.6, fontStyle: 'italic' }}>
                            (Version wird in package.json verwaltet)
                        </Box>
                    </Typography>

                    {isIOS && (
                        <>
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => setShowInstructions(!showInstructions)}
                                startIcon={<InfoIcon sx={{ fontSize: '1rem !important' }} />}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    p: 0,
                                    minWidth: 0,
                                    opacity: 0.8,
                                    '&:hover': { bgcolor: 'transparent', opacity: 1 }
                                }}
                            >
                                {showInstructions ? 'Anleitung ausblenden' : 'Hilfe für iOS anzeigen'}
                            </Button>
                            <Collapse in={showInstructions}>
                                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="caption" component="p" sx={{ lineHeight: 1.5, fontSize: '0.7rem' }}>
                                        Falls der Button nicht reagiert:<br />
                                        1. Schließe die App komplett (im App-Switcher nach oben wischen).<br />
                                        2. Öffne die App erneut.<br />
                                        3. Sollte das nicht helfen, in der App einmal kräftig nach unten ziehen (Pull-to-Refresh).
                                    </Typography>
                                </Box>
                            </Collapse>
                        </>
                    )}
                </Box>
            </Alert>
        </Snackbar>
    )
}
