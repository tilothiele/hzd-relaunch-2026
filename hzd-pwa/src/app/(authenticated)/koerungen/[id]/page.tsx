'use client'

import { KoerungVeranstaltungEditor } from '@/components/koerung/KoerungVeranstaltungEditor'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function KoerungVeranstaltungDetailPage() {
	const params = useParams()
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

	return <KoerungVeranstaltungEditor veranstaltungId={recordId} />
}
