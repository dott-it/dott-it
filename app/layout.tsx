import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import React from 'react'
import { Providers } from './providers'
import { Fredoka } from 'next/font/google'

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Eddo Learning Platform',
    template: '%s | Eddo Learning Platform',
  },
  description: 'Eddo Learning Platform - Assessment Management System',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background font-sans antialiased ${fredoka.variable}`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring">
              Skip to main content
            </a>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
