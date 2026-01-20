'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'

interface AuthGuardProps {
    children: React.ReactNode
    fallback: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const { isAuthenticated, isInitialized } = useAuth()

    if (!isInitialized) {
        return null // Or a loading spinner
    }

    if (isAuthenticated) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
