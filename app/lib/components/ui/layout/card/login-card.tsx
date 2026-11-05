import * as React from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardContent } from './index'
import { Typography } from '../../typography'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

interface LoginCardProps {
  title?: string
  tagline?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const DefaultLoginMark = (
  <Image
    src="/dottit-logo.png"
    alt={BRAND_NAME}
    width={112}
    height={112}
    className="size-28 rounded-2xl object-contain shadow-lg ring-1 ring-white/10"
    priority
  />
)

const LoginCard = React.forwardRef<HTMLDivElement, LoginCardProps>(
  (
    {
      title = BRAND_NAME,
      tagline = BRAND_TAGLINE,
      subtitle = 'Sign in to access your workspace and assessments',
      icon = DefaultLoginMark,
      children,
    },
    ref,
  ) => (
    <div className="flex min-h-screen items-center justify-center bg-brand-gunmetal p-4">
      <Card ref={ref} className="w-full max-w-md border-0 shadow-2xl shadow-black/40">
        <CardHeader className="text-center" padding="lg">
          {icon && <div className="mb-5 flex items-center justify-center">{icon}</div>}
          <Typography variant="h1" className="font-fredoka" color="primary">
            {title}
          </Typography>
          {tagline ? (
            <Typography variant="body2" className="mt-1 font-medium" color="primary">
              {tagline}
            </Typography>
          ) : null}
          <Typography variant="body2" color="muted">
            {subtitle}
          </Typography>
        </CardHeader>
        <CardContent hasHeader padding="lg">
          {children}
        </CardContent>
      </Card>
    </div>
  ),
)
LoginCard.displayName = 'LoginCard'

export { LoginCard }
