'use client'

import { createContext, useContext, type ReactNode } from 'react'

const SearchConfigContext = createContext(false)

interface SearchConfigProviderProps {
	enabled: boolean
	children: ReactNode
}

export function SearchConfigProvider({
	enabled,
	children,
}: SearchConfigProviderProps) {
	return (
		<SearchConfigContext.Provider value={enabled}>
			{children}
		</SearchConfigContext.Provider>
	)
}

export function useSearchEnabled(): boolean {
	return useContext(SearchConfigContext)
}
