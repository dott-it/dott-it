import React from 'react'
import { Typography } from './typography'

export const QuickStartExample = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Typography variant="h1" textGradient>
        Quick Start Guide
      </Typography>

      <Typography variant="subtitle1" color="muted">
        Get started with the Typography component in just a few steps
      </Typography>

      <div className="space-y-4">
        <Typography variant="h3">Basic Usage</Typography>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <Typography variant="body2" component="pre" className="whitespace-pre-wrap">
            {`import { Typography } from '@/app/shared/components/ui/typography'

// Basic variants
<Typography variant="h1">Heading 1</Typography>
<Typography variant="h2">Heading 2</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption">Caption text</Typography>`}
          </Typography>
        </div>

        <Typography variant="h3">Advanced Styling</Typography>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <Typography variant="body2" component="pre" className="whitespace-pre-wrap">
            {`// Gradient text
<Typography variant="h2" textGradient>
  Beautiful Gradient Title
</Typography>

// Custom styling
<Typography 
  variant="body1" 
  color="success" 
  fontWeight="medium"
  opacity={0.8}
  textTransform="capitalize"
>
  Success message
</Typography>`}
          </Typography>
        </div>

        <Typography variant="h3">Live Examples</Typography>

        <div className="space-y-2">
          <Typography variant="h1" textGradient>
            Gradient Heading
          </Typography>

          <Typography variant="h3" color="primary">
            Primary Color Heading
          </Typography>

          <Typography variant="body1" color="success" fontWeight="medium">
            ✅ Success message with medium weight
          </Typography>

          <Typography variant="caption" color="warning" textTransform="uppercase">
            ⚠️ Warning message in uppercase
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default QuickStartExample
