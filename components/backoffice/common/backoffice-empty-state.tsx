'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'

export interface BackofficeEmptyStateProps {
  title: string
  message: string
  backUrl?: string
  backLabel?: string
  buttonVariant?: 'default' | 'outline'
}

export function BackofficeEmptyState({
  title,
  message,
  backUrl = '/backoffice',
  backLabel = 'Back to Backoffice',
  buttonVariant = 'outline',
}: BackofficeEmptyStateProps) {
  const router = useRouter()

  const ButtonComponent = buttonVariant === 'outline' ? Button.Outline : Button

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Typography variant="h2" className="mb-2">
          {title}
        </Typography>
        <Typography variant="body1" color="muted" className="mb-4">
          {message}
        </Typography>
        <ButtonComponent onClick={() => router.push(backUrl)}>
          {backLabel}
        </ButtonComponent>
      </CardContent>
    </Card>
  )
}

