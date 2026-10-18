'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { pauseWurfabnahmeAutosave } from '@/services/wurfabnahme-db'

function isWurfabnahmeEditorPath(pathname: string): boolean {
	const path = pathname.replace(/\/$/, '') || '/'
	if (path === '/wurfabnahmen/neu') return true
	return /^\/wurfabnahmen\/[^/]+$/.test(path)
}

export function WurfabnahmeAutosaveGuard() {
	const pathname = usePathname()

	useEffect(() => {
		if (!isWurfabnahmeEditorPath(pathname)) {
			pauseWurfabnahmeAutosave()
		}
	}, [pathname])

	return null
}
