'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MeineKoerboegenNeuRedirectPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/koerungen/neu')
	}, [router])

	return null
}
