'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MeineKoerboegenRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/koerungen')
	}, [router])

	return null
}
