'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WurfabnahmeRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/wurfabnahmen')
	}, [router])

	return null
}
