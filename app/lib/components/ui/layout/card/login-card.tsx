import * as React from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardContent } from './index'
import { Typography } from '../../typography'

interface LoginCardProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const DefaultLoginMark = (
  <Image
    src="/dottit-logo.png"
    alt="Dott.it"
    width={64}
    height={64}
    className="size-16 object-contain"
    priority
  />
)

const LoginCard = React.forwardRef<HTMLDivElement, LoginCardProps>(
  (
    {
      title = 'Dott.it',
      subtitle = 'Sign in to access your workspace and assessments',
      icon = DefaultLoginMark,
      children,
    },
    ref,
  ) => (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card ref={ref} className="w-full max-w-md">
        <CardHeader className="text-center" padding="lg">
          {icon && <div className="mb-4 flex items-center justify-center gap-2">{icon}</div>}
          <Typography variant="h1" className="font-fredoka" color="primary">
            {title}
          </Typography>
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
