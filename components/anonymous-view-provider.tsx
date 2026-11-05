"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AnonymousViewContextType {
    showStudentInfo: boolean
    setShowStudentInfo: (show: boolean) => void
    toggleStudentInfo: () => void
}

const AnonymousViewContext = createContext<AnonymousViewContextType | undefined>(undefined)

export function AnonymousViewProvider({ children }: { children: ReactNode }) {
    const [showStudentInfo, setShowStudentInfo] = useState(false)

    const toggleStudentInfo = () => {
        setShowStudentInfo(prev => !prev)
    }

    return (
        <AnonymousViewContext.Provider value={{
            showStudentInfo,
            setShowStudentInfo,
            toggleStudentInfo
        }}>
            {children}
        </AnonymousViewContext.Provider>
    )
}

export function useAnonymousView() {
    const context = useContext(AnonymousViewContext)
    if (context === undefined) {
        throw new Error('useAnonymousView must be used within an AnonymousViewProvider')
    }
    return context
} 