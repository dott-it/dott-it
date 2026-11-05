'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { workspaceEntryHref } from '@/lib/library/browse/library-workspace-nav'

export function LibraryPublicHeader() {
  const { status } = useSession()
  const workspaceHref = workspaceEntryHref(status === 'authenticated')

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/library/openscied" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/dottit-logo.png"
            alt="Dott.it"
            width={32}
            height={32}
            className="size-8 shrink-0 object-contain"
            priority
          />
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold leading-none text-[#001242]">
              OpenSciEd Assessment Library
            </span>
          </div>
        </Link>
        <Button asChild size="sm" className="shrink-0">
          <Link href={workspaceHref} target="_blank" rel="noopener noreferrer">
            Workspace
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </header>
  )
}
