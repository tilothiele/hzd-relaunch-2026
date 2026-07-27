'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getReadArticles } from '@/lib/client/db'
import type { NewsArticle } from '@/lib/server/news-utils'
import type { ThemeDefinition } from '@/themes'
import { NewsCard } from './news-card'
import { NewsCardListView } from './news-card-list-view'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { ViewToggle } from '@/components/common/view-toggle'
import { CollapsibleSearchPanel, type CollapsibleSearchCriteria } from '@/components/common/collapsible-search-panel'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { searchNewsArticles } from '@/lib/strapi/api'
import { NEWS_ARTICLE_DEFAULT_SORT } from '@/lib/strapi/populate'

const MAX_LOOKBACK_YEARS = 5

interface NewsArticleListProps {
	articles: NewsArticle[]
	strapiBaseUrl: string
	theme: ThemeDefinition
	categoryDocumentId?: string
	pageSize?: number
}

export function NewsArticleList({
	articles: initialArticles,
	strapiBaseUrl,
	theme,
	categoryDocumentId,
	pageSize = 100,
}: NewsArticleListProps) {
	const [readArticles, setReadArticles] = useState<Set<string>>(new Set())
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const currentYear = new Date().getFullYear()
	const [selectedYear, setSelectedYear] = useState(currentYear)
	const [articles, setArticles] = useState<NewsArticle[]>(initialArticles)
	const [searchCriteria, setSearchCriteria] = useState<CollapsibleSearchCriteria>({
		searchPhrase: '',
		newsArticleTagIds: [],
	})
	const [isSearching, setIsSearching] = useState(false)
	const [searchError, setSearchError] = useState<Error | null>(null)

	const hasActiveSearch = Boolean(
		searchCriteria.searchPhrase.trim()
		|| searchCriteria.newsArticleTagIds.length > 0,
	)

	useEffect(() => {
		setArticles(initialArticles)
	}, [initialArticles])

	useEffect(() => {
		getReadArticles().then(setReadArticles).catch(console.error)
	}, [])

	const runSearch = useCallback(async (criteria: CollapsibleSearchCriteria) => {
		const phrase = criteria.searchPhrase.trim()
		const tagIds = criteria.newsArticleTagIds
		const nextCriteria = { searchPhrase: phrase, newsArticleTagIds: tagIds }
		setSearchCriteria(nextCriteria)
		setSearchError(null)

		if (!phrase && tagIds.length === 0) {
			setArticles(initialArticles)
			return
		}

		setIsSearching(true)
		try {
			const { newsArticles } = await searchNewsArticles({
				categoryDocumentId,
				searchPhrase: phrase || undefined,
				newsArticleTagIds: tagIds.length > 0 ? tagIds : undefined,
				pageSize,
				sort: [...NEWS_ARTICLE_DEFAULT_SORT],
			})
			setArticles(newsArticles as unknown as NewsArticle[])
		} catch (err) {
			setSearchError(
				err instanceof Error
					? err
					: new Error('Suche konnte nicht ausgeführt werden.'),
			)
			setArticles([])
		} finally {
			setIsSearching(false)
		}
	}, [categoryDocumentId, initialArticles, pageSize])

	const handleClearSearch = useCallback(() => {
		setSearchCriteria({ searchPhrase: '', newsArticleTagIds: [] })
		setSearchError(null)
		setArticles(initialArticles)
	}, [initialArticles])

	const filteredArticles = useMemo(
		() => {
			const source = articles
			if (hasActiveSearch) {
				return [...source].sort((a, b) => {
					const aDate = new Date(a.DateOfPublication || a.publishedAt || 0).getTime()
					const bDate = new Date(b.DateOfPublication || b.publishedAt || 0).getTime()
					return bDate - aDate
				})
			}

			return source
				.filter((article) => {
					const publicationDate = article.DateOfPublication || article.publishedAt
					if (!publicationDate) return false

					const date = new Date(publicationDate)
					if (Number.isNaN(date.getTime())) return false

					const year = date.getFullYear()
					return year === selectedYear || year === selectedYear - 1
				})
				.sort((a, b) => {
					const aDate = new Date(a.DateOfPublication || a.publishedAt || 0).getTime()
					const bDate = new Date(b.DateOfPublication || b.publishedAt || 0).getTime()
					return bDate - aDate
				})
		},
		[articles, selectedYear, hasActiveSearch],
	)

	const handleOlderYears = () => {
		if (selectedYear > currentYear - MAX_LOOKBACK_YEARS) {
			setSelectedYear(selectedYear - 1)
		}
	}

	const handleNewerYears = () => {
		if (selectedYear < currentYear) {
			setSelectedYear(selectedYear + 1)
		}
	}

	return (
		<Box sx={{ width: '100%' }}>
			{categoryDocumentId ? (
				<Box sx={{ mb: 2 }}>
					<CollapsibleSearchPanel
						theme={theme}
						categoryDocumentId={categoryDocumentId}
						placeholder='Suche in Überschrift, Untertitel oder Teaser…'
						activeCriteria={hasActiveSearch ? searchCriteria : undefined}
						onSearch={runSearch}
						onClearActiveSearch={handleClearSearch}
					/>
				</Box>
			) : null}

			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					justifyContent: 'space-between',
					alignItems: { xs: 'stretch', sm: 'center' },
					gap: 2,
					mb: 3,
				}}
			>
				{!hasActiveSearch ? (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<IconButton
							onClick={handleOlderYears}
							disabled={selectedYear <= currentYear - MAX_LOOKBACK_YEARS}
							aria-label='Ältere Jahre'
							sx={{
								color: theme.buttonColor,
								'&.Mui-disabled': { color: theme.drawerText + '80' },
							}}
						>
							<ChevronLeftIcon />
						</IconButton>
						<Typography variant='h6' sx={{ color: theme.headlineColor, fontWeight: 'bold' }}>
							{selectedYear - 1} / {selectedYear}
						</Typography>
						<IconButton
							onClick={handleNewerYears}
							disabled={selectedYear >= currentYear}
							aria-label='Neuere Jahre'
							sx={{
								color: theme.buttonColor,
								'&.Mui-disabled': { color: theme.drawerText + '80' },
							}}
						>
							<ChevronRightIcon />
						</IconButton>
					</Box>
				) : (
					<Typography variant='body2' sx={{ color: theme.textColor }}>
						Suchergebnisse{categoryDocumentId ? ' in dieser Kategorie' : ''}
					</Typography>
				)}

				<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
			</Box>

			{isSearching ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
					<CircularProgress size={36} sx={{ color: theme.buttonColor }} />
				</Box>
			) : null}

			{searchError ? (
				<Typography variant='body1' sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
					{searchError.message}
				</Typography>
			) : null}

			{!isSearching && !searchError && filteredArticles.length === 0 ? (
				<Typography variant='body1' sx={{ textAlign: 'center', py: 4, color: theme.textColor }}>
					{hasActiveSearch
						? 'Keine Beiträge für diese Suche gefunden.'
						: `Keine Beiträge für das Jahr ${selectedYear} gefunden.`}
				</Typography>
			) : null}

			{!isSearching && viewMode === 'cards' ? (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
						gap: 4,
					}}
				>
					{filteredArticles.map((article) => (
						<NewsCard
							key={article.documentId}
							article={article}
							strapiBaseUrl={strapiBaseUrl}
							theme={theme}
							isUnread={!readArticles.has(article.documentId)}
						/>
					))}
				</Box>
			) : null}

			{!isSearching && viewMode === 'table' ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					{filteredArticles.map((article) => (
						<NewsCardListView
							key={article.documentId}
							article={article}
							strapiBaseUrl={strapiBaseUrl}
							theme={theme}
							isUnread={!readArticles.has(article.documentId)}
						/>
					))}
				</Box>
			) : null}
		</Box>
	)
}
