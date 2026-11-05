import React from 'react'
import { Typography } from './typography'

export const TypographyUsageExample = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Page Header */}
      <header className="space-y-4 text-center">
        <Typography variant="h1" textGradient>
          Welcome to Our Platform
        </Typography>
        <Typography variant="subtitle1" color="muted">
          A comprehensive solution for modern applications
        </Typography>
      </header>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Section 1: Features */}
        <section>
          <Typography variant="h2" color="primary" className="mb-6">
            Key Features
          </Typography>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Typography variant="h4" color="success">
                Easy Integration
              </Typography>
              <Typography variant="body1">
                Simple and intuitive API that makes it easy to integrate into any project.
              </Typography>
            </div>

            <div className="space-y-3">
              <Typography variant="h4" color="info">
                Flexible Styling
              </Typography>
              <Typography variant="body1">
                Extensive customization options to match your design system perfectly.
              </Typography>
            </div>
          </div>
        </section>

        {/* Section 2: Statistics */}
        <section className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
          <Typography variant="h3" className="mb-4">
            Platform Statistics
          </Typography>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Typography variant="h2" color="primary" fontWeight="bold">
                10K+
              </Typography>
              <Typography variant="caption" color="muted" textTransform="uppercase">
                Active Users
              </Typography>
            </div>

            <div>
              <Typography variant="h2" color="success" fontWeight="bold">
                99.9%
              </Typography>
              <Typography variant="caption" color="muted" textTransform="uppercase">
                Uptime
              </Typography>
            </div>

            <div>
              <Typography variant="h2" color="info" fontWeight="bold">
                24/7
              </Typography>
              <Typography variant="caption" color="muted" textTransform="uppercase">
                Support
              </Typography>
            </div>
          </div>
        </section>

        {/* Section 3: Call to Action */}
        <section className="space-y-4 text-center">
          <Typography variant="h3" color="primary">
            Ready to Get Started?
          </Typography>

          <Typography variant="body1" color="muted" className="mx-auto max-w-2xl">
            Join thousands of developers who are already using our platform to build amazing
            applications.
          </Typography>

          <div className="flex justify-center gap-4">
            <button className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90">
              <Typography variant="button" color="white">
                Get Started
              </Typography>
            </button>

            <button className="rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50">
              <Typography variant="button" color="primary">
                Learn More
              </Typography>
            </button>
          </div>
        </section>

        {/* Section 4: Alerts */}
        <section className="space-y-4">
          <Typography variant="h4">System Notifications</Typography>

          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <Typography variant="body1" color="success" fontWeight="medium">
                ✅ System is running smoothly
              </Typography>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <Typography variant="body1" color="warning" fontWeight="medium">
                ⚠️ Scheduled maintenance in 2 hours
              </Typography>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <Typography variant="body1" color="error" fontWeight="medium">
                ❌ Critical issue detected
              </Typography>
            </div>
          </div>
        </section>

        {/* Section 5: Code Example */}
        <section>
          <Typography variant="h4" className="mb-4">
            Implementation Example
          </Typography>

          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
            <Typography variant="body2" component="pre" className="whitespace-pre-wrap">
              {`import { Typography } from '@/app/shared/components/ui/typography'

// Basic usage
<Typography variant="h1">Page Title</Typography>
<Typography variant="body1" color="primary">
  Important content
</Typography>

// Advanced styling
<Typography 
  variant="h2" 
  color="success" 
  fontWeight="bold"
  textTransform="uppercase"
  textGradient
>
  Beautiful Heading
</Typography>`}
            </Typography>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t pt-6">
        <div className="flex items-center justify-between">
          <Typography variant="body2" color="muted">
            © 2024 Your Company. All rights reserved.
          </Typography>

          <div className="flex gap-4">
            <Typography
              variant="caption"
              color="primary"
              className="cursor-pointer hover:underline"
            >
              Privacy Policy
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              className="cursor-pointer hover:underline"
            >
              Terms of Service
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              className="cursor-pointer hover:underline"
            >
              Contact
            </Typography>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TypographyUsageExample
