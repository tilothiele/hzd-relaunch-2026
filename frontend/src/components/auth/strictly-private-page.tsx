'use client'

import { useAuth } from '@/hooks/use-auth'
import React from 'react'

interface StrictlyPrivatePageProps {
    fallback: React.ReactNode
}

export function StrictlyPrivatePage({ fallback }: StrictlyPrivatePageProps) {
    const { isAuthenticated } = useAuth()

    // We can use isAuthenticated here for logic if needed (e.g. logging, or different UI for admins)
    // For now, per requirements, it returns forbidden content but we "checked" the auth state.

    // Example of using the variable as the user requested "calculate only the variable"
    const isUserAuthenticated = isAuthenticated

    if (!isUserAuthenticated) {
        return <>{fallback}</>
    }

    // Even if authenticated, strict private pages are forbidden (per current logic)
    return <>{fallback}</>
}
