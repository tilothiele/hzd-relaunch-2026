import { Box, Button, Flex, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

interface SearchIndexStatus {
	running: boolean
	lastFinishedAt: string | null
	lastError: string | null
	indexed: number
	removed: number
}

interface SearchStatusResponse {
	enabled: boolean
	status: SearchIndexStatus | null
}

function readErrorMessage(error: unknown): string {
	if (!error || typeof error !== 'object' || !('response' in error)) {
		return ''
	}
	const data = (error as {
		response?: { data?: { error?: { message?: string } } }
	}).response?.data
	return data?.error?.message ?? ''
}

function formatFinishedAt(value: string | null): string {
	if (!value) {
		return ''
	}
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value
	}
	return date.toLocaleString('de-DE')
}

const SearchIndexPanel = () => {
	const { formatMessage } = useIntl()
	const { get, post } = useFetchClient()
	const { toggleNotification } = useNotification()
	const [enabled, setEnabled] = useState(true)
	const [running, setRunning] = useState(false)
	const [status, setStatus] = useState<SearchIndexStatus | null>(null)

	useEffect(() => {
		let cancelled = false
		get('/hzd-plugin/search/status')
			.then((response) => {
				if (cancelled) {
					return
				}
				const body = response.data as SearchStatusResponse
				setEnabled(body.enabled)
				setStatus(body.status)
			})
			.catch(() => {
				if (!cancelled) {
					setEnabled(false)
				}
			})
		return () => {
			cancelled = true
		}
	}, [get])

	const handleReindex = async () => {
		try {
			setRunning(true)
			const response = await post('/hzd-plugin/search/reindex')
			const body = response.data as { status?: SearchIndexStatus }
			setStatus(body.status ?? null)
			toggleNotification({
				type: 'success',
				message: formatMessage({
					id: getTranslation('searchIndex.success'),
					defaultMessage: 'Die Vollindexierung ist abgeschlossen.',
				}),
			})
		} catch (error) {
			const message = readErrorMessage(error)
			toggleNotification({
				type: 'danger',
				message: message || formatMessage({
					id: getTranslation('searchIndex.error'),
					defaultMessage: 'Die Vollindexierung konnte nicht gestartet werden.',
				}),
			})
		} finally {
			setRunning(false)
		}
	}

	const finishedAt = formatFinishedAt(status?.lastFinishedAt ?? null)

	return (
		<Box
			background="neutral0"
			borderColor="neutral150"
			hasRadius
			padding={6}
			shadow="tableShadow"
			width="100%"
		>
			<Flex direction="column" alignItems="flex-start" gap={4}>
				<Box>
					<Typography tag="h2" variant="beta">
						{formatMessage({
							id: getTranslation('searchIndex.title'),
							defaultMessage: 'Suche',
						})}
					</Typography>
					<Box paddingTop={2}>
						<Typography textColor="neutral600">
							{formatMessage({
								id: getTranslation('searchIndex.description'),
								defaultMessage:
									'Indexiert veröffentlichte Seiten und News-Artikel neu. Seiten mit gesetzter Restriction und Public = false werden nicht aufgenommen.',
							})}
						</Typography>
					</Box>
				</Box>

				<Button
					type="button"
					loading={running}
					disabled={!enabled || running}
					onClick={handleReindex}
				>
					{formatMessage({
						id: getTranslation('searchIndex.button'),
						defaultMessage: 'Vollindexierung starten',
					})}
				</Button>

				{!enabled ? (
					<Typography textColor="danger600">
						{formatMessage({
							id: getTranslation('searchIndex.disabled'),
							defaultMessage: 'Meilisearch ist nicht konfiguriert.',
						})}
					</Typography>
				) : null}

				{status?.lastFinishedAt ? (
					<Typography textColor="neutral600">
						{formatMessage(
							{
								id: getTranslation('searchIndex.result'),
								defaultMessage:
									'Zuletzt am {time}: {indexed} Dokumente indexiert, {removed} entfernt.',
							},
							{
								time: finishedAt,
								indexed: status.indexed,
								removed: status.removed,
							},
						)}
					</Typography>
				) : null}

				{status?.lastError ? (
					<Typography textColor="danger600">{status.lastError}</Typography>
				) : null}
			</Flex>
		</Box>
	)
}

export { SearchIndexPanel }
