"use client";
// mark as client component

import {SessionProvider} from "next-auth/react"
import React from 'react'

export const SessionWrapper = ({children}: {children: React.ReactNode}) => {
  return (
    <SessionProvider>{children}</SessionProvider>
  )
}
