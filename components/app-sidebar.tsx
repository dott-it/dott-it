"use client"

import { Book, Briefcase, Home, School, Atom, Eye, EyeOff } from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { useSidebar } from "@/components/ui/sidebar"
import { useAnonymousView } from "@/components/anonymous-view-provider"
import { Button } from "@/components/ui/button"
// import { getAssessments } from "@/lib/data-service"
// import { useEffect, useState } from "react"

// Mock units for navigation - replace with actual data source  
const _mockUnits = [
    { id: "6.1", title: "Light & Matter" },
    { id: "6.2", title: "Thermal Energy" },
    { id: "6.3", title: "Weather & Climate" },
    { id: "7.1", title: "Chemical Reactions" },
    { id: "7.2", title: "Organisms & Environment" },
    { id: "8.1", title: "Contact Forces" },
    { id: "8.2", title: "Sound Waves" },
    { id: "8.3", title: "Genetics" }
]

interface SidebarLinkProps {
    href: string
    children: React.ReactNode
    isActive: boolean
    tooltip: string
    onClick?: () => void
}

function SidebarLink({ href, children, isActive, tooltip, onClick }: SidebarLinkProps) {
    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 rounded-lg p-3 text-sm transition-all duration-200 hover:bg-accent/50 
                ${isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'}`}
            onClick={onClick}
            title={tooltip}
        >
            {children}
        </Link>
    )
}

// interface Assessment {
//     id: string
//     title: string
//     unitName: string
//     subject: string
//     grade: number
//     type: string
//     dueDate: string
//     totalRecords: number
//     pendingRecords: number
// }

export function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { open: sidebarIsOpen, setOpen: setSidebarOpen } = useSidebar()
    const [isCelebrating, setIsCelebrating] = useState(false)
    const { showStudentInfo, toggleStudentInfo } = useAnonymousView()

    const handleSidebarLinkClick = () => {
        setSidebarOpen(false)
    }

    const _handleLogoClick = () => {
        router.push('/')
        setSidebarOpen(false)
    }

    // Handle celebration events
    useEffect(() => {
        const handleCelebration = (event: CustomEvent) => {
            if (event.detail?.type === 'message-sent') {
                setIsCelebrating(true)
                setTimeout(() => setIsCelebrating(false), 3000)
            }
        }

        globalThis.addEventListener('eddo-celebration', handleCelebration as globalThis.EventListener)
        return () => {
            globalThis.removeEventListener('eddo-celebration', handleCelebration as globalThis.EventListener)
        }
    }, [])

    return (
        <>
            {/* Fluid Glass Sidebar Animation, button always inside sidebar */}
            <div
                className={`fixed left-4 top-4 z-50 flex origin-top-left
                    flex-col shadow-xl backdrop-blur-lg
                    transition-all duration-700 ease-out
                    ${sidebarIsOpen
                        ? 'pointer-events-auto h-[calc(100vh-2rem)] w-[320px] scale-100 border border-sidebar-border bg-sidebar/60 opacity-100'
                        : 'pointer-events-auto size-12 scale-100 border-transparent bg-transparent opacity-100'}`}
                style={{
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: sidebarIsOpen ? 16 : 24,
                    borderBottomRightRadius: sidebarIsOpen ? 16 : 24,
                    borderBottomLeftRadius: sidebarIsOpen ? 16 : 24
                }}
            >
                {/* Header area - contains the logo button and title when expanded */}
                <div className="flex items-center gap-2 pl-0 pr-4 pt-2" style={{ height: '48px' }}>
                    {/* Logo button - always visible and acts as trigger */}
                    <button
                        onClick={() => {
                            if (sidebarIsOpen) {
                                setSidebarOpen(false)
                            } else {
                                setSidebarOpen(true)
                            }
                        }}
                        className="flex size-12 max-h-12 min-h-12 min-w-12 max-w-12 items-center justify-center rounded-full bg-sidebar/60 p-0 backdrop-blur-lg transition-colors hover:bg-sidebar/70"
                        aria-label={sidebarIsOpen ? 'Dismiss sidebar' : 'Open sidebar'}
                        style={{ border: 'none', boxShadow: 'none', position: 'relative', top: 0, left: 0 }}
                    >
                        <Image
                            src="/dottit-logo.png"
                            alt="Dott.it"
                            width={48}
                            height={48}
                            className={`size-12 max-h-12 min-h-12 min-w-12 max-w-12 object-contain ${isCelebrating ? 'animate-somersault' : ''}`}
                            priority
                        />
                    </button>

                    {/* Title - only visible when open */}
                    {sidebarIsOpen && (
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate text-xl font-semibold font-fredoka">Dott.it</span>
                            <span className="truncate text-xs">Feedback and Assessment System</span>
                        </div>
                    )}
                </div>

                {/* Sidebar content, only visible when open, starts just below button/header */}
                <div className={`flex h-full flex-col pt-2 transition-opacity duration-300 ${sidebarIsOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                    <div className="flex items-center justify-between border-b p-4 pt-0" />

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3">
                        <SidebarLink
                            href="/"
                            isActive={pathname === '/'}
                            tooltip="Home"
                            onClick={handleSidebarLinkClick}
                        >
                            <Home className="size-4" />
                            <span>Home</span>
                        </SidebarLink>

                        <SidebarLink
                            href="/library"
                            isActive={pathname.startsWith('/library')}
                            tooltip="Library"
                            onClick={handleSidebarLinkClick}
                        >
                            <Book className="size-4" />
                            <span>Library</span>
                        </SidebarLink>

                        <SidebarLink
                            href="/workspace"
                            isActive={pathname.startsWith('/workspace')}
                            tooltip="Workspace"
                            onClick={handleSidebarLinkClick}
                        >
                            <Briefcase className="size-4" />
                            <span>Workspace</span>
                        </SidebarLink>

                        {/* Units/Assessments Section - Temporarily disabled for testing */}
                        {/* {pathname.startsWith('/workspace') && (
                            <div className="pt-4">
                                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Units
                                </div>
                                <div className="space-y-1">
                                    {mockUnits.map((unit) => (
                                        <SidebarLink
                                            key={unit.id}
                                            href={`/workspace/assessments/${unit.id}`}
                                            asChild
                                            tooltip={unit.title}
                                            isActive={pathname.startsWith(`/workspace/assessments/${unit.id}`)}
                                            onClick={handleSidebarLinkClick}
                                        >
                                            <>
                                                <FolderOpen className="w-4 h-4" />
                                                <span className="truncate">{unit.id} {unit.title}</span>
                                            </>
                                        </SidebarLink>
                                    ))}
                                </div>
                            </div>
                        )} */}

                        {/* Library Sections */}
                        {pathname.startsWith('/library') && (
                            <div className="pt-4">
                                <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Curricula
                                </div>
                                <div className="space-y-1">
                                    <SidebarLink
                                        href="/library/openscied"
                                        isActive={pathname.startsWith('/library/openscied')}
                                        tooltip="OpenSciEd"
                                        onClick={handleSidebarLinkClick}
                                    >
                                        <Atom className="size-4" />
                                        <span>OpenSciEd</span>
                                    </SidebarLink>
                                </div>

                                {/* Grade Levels for OpenSciEd */}
                                {pathname.startsWith('/library/openscied') && (
                                    <div className="ml-4 mt-2 space-y-1">
                                        <SidebarLink
                                            href="/library/openscied"
                                            isActive={pathname.startsWith('/library/openscied')}
                                            tooltip="Middle School (Grades 6-8)"
                                            onClick={handleSidebarLinkClick}
                                        >
                                            <School className="size-3" />
                                            <span className="text-xs">Middle School</span>
                                        </SidebarLink>
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="space-y-2 border-t p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleStudentInfo}
                            className="w-full justify-start text-xs"
                        >
                            {showStudentInfo ? (
                                <>
                                    <EyeOff className="mr-2 size-3" />
                                    Hide Student Info
                                </>
                            ) : (
                                <>
                                    <Eye className="mr-2 size-3" />
                                    Show Student Info
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            EDDO Assessment Platform
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}