'use client'

import React from 'react'
import { LoginCard } from '../../lib/components/ui/layout/card'
import { LoginForm } from '../../lib/components/auth/login-form'

export default function LoginPage() {
  return (
    <LoginCard title="Dott.it" subtitle="Sign in to access your workspace and assessments">
      <LoginForm />
    </LoginCard>
  )
}
