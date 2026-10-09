'use client'

import { TrackUmamiEvent } from '@/components/analytics/track-umami-event'

interface TrackNewsArticleViewProps {
	slug: string
}

const EVENT_NAME = 'news-article-view'

function normalizeSlug (slug: string) {
	return slug.trim().replace(/^\/+/, '')
}

export function TrackNewsArticleView ({ slug }: TrackNewsArticleViewProps) {
	const normalizedSlug = normalizeSlug(slug)
	if (!normalizedSlug) {
		return null
	}

	return (
		<TrackUmamiEvent
			eventName={EVENT_NAME}
			eventData={{ slug: normalizedSlug }}
		/>
	)
}
