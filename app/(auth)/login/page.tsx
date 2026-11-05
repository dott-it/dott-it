'use client'

import React from 'react'
import { LoginCard } from '../../lib/components/ui/layout/card'
import { LoginForm } from '../../lib/components/auth/login-form'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

export default function LoginPage() {
  return (
    <LoginCard
      title={BRAND_NAME}
      tagline={BRAND_TAGLINE}
      subtitle="Sign in to access your workspace and assessments"
    >
      <LoginForm />
    </LoginCard>
  )
}
