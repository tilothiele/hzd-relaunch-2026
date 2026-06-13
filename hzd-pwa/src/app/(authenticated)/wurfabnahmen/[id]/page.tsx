'use client'

import { WurfabnahmeEditor } from '@/components/wurfabnahme/WurfabnahmeEditor'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WurfabnahmeDetailPage() {
	const params = useParams()
	const router = useRouter()
	const id = typeof params.id === 'string' ? params.id : params.id?.[0]
	const [recordId, setRecordId] = useState<string | undefined>(undefined)

	useEffect(() => {
		if (id) {
			setRecordId(id)
		}
	}, [id])

	if (!recordId) {
		return null
	}

	return (
		<WurfabnahmeEditor
			basePath={`/wurfabnahmen/${recordId}`}
			recordId={recordId}
		/>
	)
}
