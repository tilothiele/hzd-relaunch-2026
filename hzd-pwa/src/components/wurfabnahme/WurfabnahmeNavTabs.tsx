'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
	getWurfabnahmeEditBasePath,
	getWurfabnahmeHref,
	parseWurfabnahmePage,
	WURFABNAHME_TABS,
} from '@/components/wurfabnahme/constants'

function WurfabnahmeNavTabsInner({
	variant,
	onNavigate,
}: {
	variant: 'desktop' | 'mobile'
	onNavigate?: () => void
}) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const basePath = getWurfabnahmeEditBasePath(pathname)

	if (!basePath) {
		return null
	}

	const activePage = parseWurfabnahmePage(searchParams.get('seite'))

	if (variant === 'desktop') {
		return (
			<div className="hidden sm:flex sm:items-center sm:gap-1 sm:ml-2 sm:pl-2 sm:border-l sm:border-[var(--color-kapitaensblau)]/20">
				{WURFABNAHME_TABS.map((tab) => (
					<Link
						key={tab.id}
						href={getWurfabnahmeHref(basePath, tab.id)}
						className={`inline-flex items-center rounded px-2 py-1 text-sm font-medium transition-colors ${
							activePage === tab.id
								? 'bg-[var(--color-kapitaensblau)] text-white'
								: 'text-[var(--color-kapitaensblau)]/80 hover:bg-[var(--color-kapitaensblau)]/10'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>
		)
	}

	return (
		<div className="mt-2 space-y-1 border-t border-gray-200 pt-2 dark:border-gray-700">
			<p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
				Wurfabnahme
			</p>
			{WURFABNAHME_TABS.map((tab) => (
				<Link
					key={tab.id}
					href={getWurfabnahmeHref(basePath, tab.id)}
					onClick={onNavigate}
					className={`block rounded py-2 pl-6 pr-4 text-base font-medium ${
						activePage === tab.id
							? 'bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white'
							: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
					}`}
				>
					{tab.label}
				</Link>
			))}
		</div>
	)
}

export function WurfabnahmeNavTabs({
	variant,
	onNavigate,
}: {
	variant: 'desktop' | 'mobile'
	onNavigate?: () => void
}) {
	return (
		<Suspense fallback={null}>
			<WurfabnahmeNavTabsInner variant={variant} onNavigate={onNavigate} />
		</Suspense>
	)
}
