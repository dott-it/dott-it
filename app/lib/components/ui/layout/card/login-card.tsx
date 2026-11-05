import * as React from 'react'
import { Card, CardHeader, CardContent } from './index'
import { Typography } from '../../typography'

interface LoginCardProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const LoginCard = React.forwardRef<HTMLDivElement, LoginCardProps>(
  (
    {
      title = 'eddo',
      subtitle = 'Sign in to access your workspace and assessments',
      icon,
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
