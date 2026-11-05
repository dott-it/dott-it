'use client'

import Link from 'next/link'
import { LucideIcon, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="py-12 text-center">
      <CardContent>
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <CardTitle className="mb-2 text-xl">{title}</CardTitle>
        <CardDescription className="mx-auto mb-6 max-w-md">
          {description}
        </CardDescription>
        {actionLabel && actionHref && (
          <Button.Primary asChild>
            <Link href={actionHref}>
              <Plus className="mr-2 size-4" />
              {actionLabel}
            </Link>
          </Button.Primary>
        )}
      </CardContent>
    </Card>
  )
}



