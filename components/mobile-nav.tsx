"use client"

import { useState } from "react"
import Link from "next/link"
import { Book, Briefcase, ChevronDown, ChevronRight, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface NavItem {
  href: string
  label: string
}


const libraryItems = [
  {
    title: "OpenSciEd",
    href: "/library/openscied",
    description: "Browse OpenSciEd middle school units and assessments",
    icon: Book,
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0" aria-label="Navigation menu">
        <span className="sr-only" role="heading" aria-level={2}>Navigation</span>
        <nav className="grid gap-2 text-lg font-medium">
          {/* Workspace Link */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-4 py-3 hover:bg-accent hover:text-accent-foreground"
          >
            <Briefcase className="size-5" />
            Workspace
          </Link>

          {/* Library Section */}
          <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 hover:bg-accent hover:text-accent-foreground">
              <div className="flex items-center gap-3">
                <Book className="size-5" />
                Library
              </div>
              {libraryOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              <Link
                href="/library"
                onClick={() => setOpen(false)}
                className="block rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Overview
              </Link>
              {libraryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <item.icon className="size-4" />
                  {item.title}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
