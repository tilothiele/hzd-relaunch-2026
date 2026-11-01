'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
	createSearchSeed,
	sanitizeListSeed,
	type BreederListOrder,
} from '@/lib/breeder-list-order'

interface BreederListOrderState {
	order: BreederListOrder
	seed: string
	setOrder: (order: BreederListOrder) => void
}

/**
 * Sortierung und Seed liegen in der Adresse.
 * Ein neuer Suchbegriff setzt einen neuen Seed, das Blättern nicht.
 */
export function useBreederListOrder(
	nameFilter: string,
): BreederListOrderState {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const [order, setOrder] = useState<BreederListOrder>(() => (
		searchParams.get('order') === 'zip' ? 'zip' : 'random'
	))
	const [seed, setSeed] = useState(() => {
		const fromUrl = sanitizeListSeed(searchParams.get('seed'))
		return fromUrl || createSearchSeed()
	})
	const filterRef = useRef(nameFilter)

	if (filterRef.current !== nameFilter) {
		filterRef.current = nameFilter
		setSeed(createSearchSeed())
	}

	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString())
		if (params.get('order') === order && params.get('seed') === seed) {
			return
		}
		params.set('order', order)
		params.set('seed', seed)
		const query = params.toString()
		router.replace(
			query ? `${pathname}?${query}` : pathname,
			{ scroll: false },
		)
	}, [order, pathname, router, searchParams, seed])

	return { order, seed, setOrder }
}
