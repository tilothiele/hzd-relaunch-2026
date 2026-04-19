'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, CircularProgress, Dialog, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { ThemeDefinition } from '@/themes'
import { useAuth } from '@/hooks/use-auth'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_MY_PENDING_PASSED_DOGS } from '@/lib/graphql/passed-dogs-queries'
import { getMoreApprovedPassedDogs } from '@/lib/server/passed-dog-actions'
import type { PassedDogCardData } from '@/lib/server/passed-dog-utils'
import { PassedDogCard, passedDogCardTitle } from './passed-dog-card'
import { PassedDogFormModal } from './passed-dog-form-modal'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { MAX_PENDING_PASSED_DOGS } from '@/lib/passed-dogs-limits'

const NOT_LOGGED_HINT =
	'Bitte melden Sie sich an und teilen uns mit, wenn Ihr Hund verstorben ist'

const PENDING_LIMIT_HINT = `Sie haben bereits ${MAX_PENDING_PASSED_DOGS} Einträge in Prüfung. Nach Freigabe können Sie weitere Meldungen einreichen.`

interface PassedDogsSectionContentProps {
	initialNodes: PassedDogCardData[]
	initialPageInfo: {
		page: number
		pageSize: number
		pageCount: number
		total: number
	}
	pageSize: number
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function PassedDogsSectionContent({
	initialNodes,
	initialPageInfo,
	pageSize,
	strapiBaseUrl,
	theme,
}: PassedDogsSectionContentProps) {
	const { isAuthenticated, user, isInitialized } = useAuth()
	const [createOpen, setCreateOpen] = useState(false)
	const [editTarget, setEditTarget] = useState<PassedDogCardData | null>(null)
	const [pending, setPending] = useState<PassedDogCardData[]>([])
	const [nodes, setNodes] = useState(initialNodes)
	const [pageInfo, setPageInfo] = useState(initialPageInfo)
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const [lightbox, setLightbox] = useState<PassedDogCardData | null>(null)
	const observer = useRef<IntersectionObserver | null>(null)

	const publicCards = useMemo(
		() => nodes.filter((d) => d.Consent === true),
		[nodes],
	)

	const loadPending = useCallback(async () => {
		if (!user?.documentId) {
			return
		}
		try {
			const res = await fetchGraphQL<{ passedDogs: PassedDogCardData[] }>(
				GET_MY_PENDING_PASSED_DOGS,
				{ variables: { userId: user.documentId } },
			)
			setPending(res.passedDogs ?? [])
		} catch (e) {
			console.error(e)
		}
	}, [user?.documentId])

	useEffect(() => {
		if (isAuthenticated && user?.documentId) {
			loadPending()
		} else {
			setPending([])
		}
	}, [isAuthenticated, user?.documentId, loadPending])

	const hasMore = page < pageInfo.pageCount

	const lastRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) {
				return
			}
			if (observer.current) {
				observer.current.disconnect()
			}
			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasMore) {
						setPage((p) => p + 1)
					}
				},
				{ rootMargin: '120px' },
			)
			if (node) {
				observer.current.observe(node)
			}
		},
		[loading, hasMore],
	)

	useEffect(() => {
		if (page <= 1) {
			return
		}
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const res = await getMoreApprovedPassedDogs(page, pageSize)
				if (!cancelled) {
					setNodes((prev) => [...prev, ...res.nodes])
					setPageInfo(res.pageInfo)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [page, pageSize])

	const refreshAfterMutation = () => {
		loadPending()
	}

	const lightboxUrl = lightbox?.Avatar
		? resolveMediaUrl(lightbox.Avatar, strapiBaseUrl)
		: null

	const uid = user?.documentId
	const atPendingLimit = pending.length >= MAX_PENDING_PASSED_DOGS

	useEffect(() => {
		if (createOpen && atPendingLimit) {
			setCreateOpen(false)
		}
	}, [createOpen, atPendingLimit])

	return (
		<div className="w-full space-y-10">
			<div className="flex flex-col items-center gap-4">
				{!isInitialized ? null : !isAuthenticated ? (
					<span className="inline-flex" title={NOT_LOGGED_HINT}>
						<button
							type="button"
							disabled
							className="cursor-not-allowed rounded-full px-6 py-3 font-semibold text-white opacity-50 shadow"
							style={{ backgroundColor: theme.buttonColor }}
						>
							Mein Hund ist verstorben
						</button>
					</span>
				) : atPendingLimit ? (
					<>
						<Typography color="textSecondary" textAlign="center" variant="body2" sx={{ maxWidth: '36rem', px: 1 }}>
							{PENDING_LIMIT_HINT}
						</Typography>
						<span className="inline-flex" title={PENDING_LIMIT_HINT}>
							<button
								type="button"
								disabled
								className="cursor-not-allowed rounded-full px-6 py-3 font-semibold text-white opacity-50 shadow"
								style={{ backgroundColor: theme.buttonColor }}
							>
								Mein Hund ist verstorben
							</button>
						</span>
					</>
				) : (
					<button
						type="button"
						onClick={() => setCreateOpen(true)}
						className="rounded-full px-6 py-3 font-semibold text-white shadow-md transition hover:opacity-90"
						style={{ backgroundColor: theme.buttonColor }}
					>
						Mein Hund ist verstorben
					</button>
				)}
			</div>

			{isAuthenticated && pending.length > 0 ? (
				<div>
					<Typography
						variant="h6"
						sx={{ mb: 2, color: theme.headlineColor, fontWeight: 700 }}
					>
						Ihre Einträge (noch nicht freigegeben)
					</Typography>
					<ul className="divide-y rounded-xl border border-neutral-200 bg-white">
						{pending.map((p) => {
							const withoutConsent = p.Consent !== true
							return (
								<li
									key={p.documentId}
									className={
										withoutConsent
											? 'flex flex-wrap items-center justify-between gap-2 border-l-4 border-amber-500 bg-amber-50/90 px-4 py-3'
											: 'flex flex-wrap items-center justify-between gap-2 px-4 py-3'
									}
								>
									<div className="min-w-0 flex-1">
										<span className="font-medium text-neutral-900">
											{passedDogCardTitle(p)}
										</span>
										{withoutConsent ? (
											<Typography
												component="span"
												display="block"
												variant="caption"
												sx={{ mt: 0.5, fontWeight: 700, color: 'rgb(146 64 14)' }}
											>
												Ohne Zustimmung zur Veröffentlichung
											</Typography>
										) : null}
									</div>
									<Button
										size="small"
										variant="outlined"
										onClick={() => setEditTarget(p)}
										sx={{ borderColor: theme.buttonColor, color: theme.buttonColor }}
									>
										Bearbeiten
									</Button>
								</li>
							)
						})}
					</ul>
				</div>
			) : null}

			<div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{publicCards.map((dog) => (
						<PassedDogCard
							key={dog.documentId}
							dog={dog}
							strapiBaseUrl={strapiBaseUrl}
							theme={theme}
							onOpen={setLightbox}
						/>
					))}
				</div>
				<div
					ref={lastRef}
					className="flex h-8 items-center justify-center py-6"
				>
					{loading ? (
						<CircularProgress size={28} sx={{ color: theme.buttonColor }} />
					) : null}
				</div>
				{!hasMore && publicCards.length > 0 ? (
					<Typography
						align="center"
						sx={{ color: theme.textColor, opacity: 0.75 }}
					>
						Alle Einträge geladen.
					</Typography>
				) : null}
				{publicCards.length === 0 && !loading ? (
					<Typography align="center" sx={{ color: theme.textColor }}>
						Noch keine Einträge.
					</Typography>
				) : null}
			</div>

			{uid ? (
				<>
					<PassedDogFormModal
						open={createOpen}
						onClose={() => setCreateOpen(false)}
						mode="create"
						initial={null}
						theme={theme}
						userDocumentId={uid}
						onSuccess={refreshAfterMutation}
					/>
					<PassedDogFormModal
						open={Boolean(editTarget)}
						onClose={() => setEditTarget(null)}
						mode="edit"
						initial={editTarget}
						theme={theme}
						userDocumentId={uid}
						onSuccess={refreshAfterMutation}
					/>
				</>
			) : null}

			<Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)} maxWidth="md" fullWidth>
				<Box sx={{ position: 'relative', p: 1 }}>
					<IconButton
						aria-label="Schließen"
						onClick={() => setLightbox(null)}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							zIndex: 1,
							bgcolor: 'rgba(0,0,0,0.45)',
							color: '#fff',
						}}
					>
						<CloseIcon />
					</IconButton>
					{lightboxUrl ? (
						<img
							src={lightboxUrl}
							alt=""
							className="max-h-[70vh] w-full rounded-lg object-contain"
						/>
					) : (
						<div className="flex h-48 items-center justify-center bg-neutral-200 text-neutral-500">
							Kein Bild
						</div>
					)}
					{lightbox?.Message ? (
						<Typography sx={{ mt: 2, px: 1, color: theme.textColor }} variant="body1">
							{lightbox.Message}
						</Typography>
					) : null}
				</Box>
			</Dialog>
		</div>
	)
}
