"use client"
import React, { createContext, useContext, useState } from "react"
import { PageHeader } from "./ui/pageHeader/page-header"

interface PageHeaderData {
    breadcrumbs: React.ReactNode
    title: string
    subtitle?: string
    badge?: React.ReactNode
}

const PageHeaderContext = createContext<{
    setHeader: (data: PageHeaderData) => void
} | null>(null)

export function usePageHeader(data: PageHeaderData) {
    const ctx = useContext(PageHeaderContext)
    React.useEffect(() => {
        ctx?.setHeader(data)
    }, [ctx, data])
}

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeader] = useState<PageHeaderData | null>(null)
    return (
        <PageHeaderContext.Provider value={{ setHeader }}>
            {header && <PageHeader {...header} />}
            {children}
        </PageHeaderContext.Provider>
    )
} 
