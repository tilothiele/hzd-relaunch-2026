'use client'

import { Suspense, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
	DatenschutzPage,
	StammblattPage,
	WelpePage,
} from './WurfabnahmePages'
import {
	parseWurfabnahmePage,
	type WurfabnahmePageId,
	getWurfabnahmeHref,
} from './constants'
import './wurfabnahme.css'

function WurfabnahmeAppInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [welpenAnzahl, setWelpenAnzahl] = useState(1)

	const activePage = parseWurfabnahmePage(searchParams.get('seite'))

	const showPage = useCallback((id: WurfabnahmePageId) => {
		router.push(getWurfabnahmeHref(id))
		window.scrollTo(0, 0)
	}, [router])

	return (
		<div className="wurfabnahme-app">
			{activePage === 'stammblatt' && (
				<StammblattPage
					welpenAnzahl={welpenAnzahl}
					onWelpenAnzahlChange={setWelpenAnzahl}
					onNext={() => showPage('welpe1')}
				/>
			)}

			{activePage === 'welpe1' && (
				<WelpePage
					onBack={() => showPage('stammblatt')}
					onNext={() => showPage('datenschutz1')}
				/>
			)}

			{activePage === 'datenschutz1' && (
				<DatenschutzPage onBack={() => showPage('welpe1')} />
			)}
		</div>
	)
}

export default function WurfabnahmeApp() {
	return (
		<Suspense fallback={<p>Lade Wurfabnahme…</p>}>
			<WurfabnahmeAppInner />
		</Suspense>
	)
}
