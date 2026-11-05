import React from 'react'
import { Typography } from './typography'

export const TypographyDemo = () => {
  return (
    <div className="space-y-8 p-6">
      <div>
        <Typography variant="h1" className="mb-4">
          Typography Demo
        </Typography>
        <Typography variant="body1" color="muted">
          A comprehensive typography component for modern applications
        </Typography>
      </div>

      {/* Variants Section */}
      <div className="space-y-4">
        <Typography variant="h2">Variants</Typography>

        <div className="space-y-2">
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
          <Typography variant="subtitle1">Subtitle 1</Typography>
          <Typography variant="subtitle2">Subtitle 2</Typography>
          <Typography variant="body1">Body 1</Typography>
          <Typography variant="body2">Body 2</Typography>
          <Typography variant="button">Button</Typography>
          <Typography variant="caption">Caption</Typography>
          <Typography variant="overline">Overline</Typography>
          <Typography variant="inherit">Inherit</Typography>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <Typography variant="h2">Colors</Typography>

        <div className="space-y-2">
          <Typography variant="body1" color="primary">
            Primary Color
          </Typography>
          <Typography variant="body1" color="secondary">
            Secondary Color
          </Typography>
          <Typography variant="body1" color="info">
            Info Color
          </Typography>
          <Typography variant="body1" color="success">
            Success Color
          </Typography>
          <Typography variant="body1" color="warning">
            Warning Color
          </Typography>
          <Typography variant="body1" color="error">
            Error Color
          </Typography>
          <Typography variant="body1" color="light">
            Light Color
          </Typography>
          <Typography variant="body1" color="dark">
            Dark Color
          </Typography>
          <Typography variant="body1" color="text">
            Text Color
          </Typography>
          <div className="rounded bg-gray-800 p-2">
            <Typography variant="body1" color="white">
              White Color
            </Typography>
          </div>
        </div>
      </div>

      {/* Font Weights Section */}
      <div className="space-y-4">
        <Typography variant="h2">Font Weights</Typography>

        <div className="space-y-2">
          <Typography variant="body1" fontWeight="light">
            Light Weight
          </Typography>
          <Typography variant="body1" fontWeight="regular">
            Regular Weight
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            Medium Weight
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            Bold Weight
          </Typography>
        </div>
      </div>

      {/* Text Transform Section */}
      <div className="space-y-4">
        <Typography variant="h2">Text Transform</Typography>

        <div className="space-y-2">
          <Typography variant="body1" textTransform="none">
            No Transform
          </Typography>
          <Typography variant="body1" textTransform="capitalize">
            capitalize text
          </Typography>
          <Typography variant="body1" textTransform="uppercase">
            Uppercase Text
          </Typography>
          <Typography variant="body1" textTransform="lowercase">
            LOWERCASE TEXT
          </Typography>
        </div>
      </div>

      {/* Gradient Text Section */}
      <div className="space-y-4">
        <Typography variant="h2">Gradient Text</Typography>

        <div className="space-y-2">
          <Typography variant="h1" textGradient>
            Gradient Text
          </Typography>
          <Typography variant="h3" textGradient>
            Another Gradient Example
          </Typography>
        </div>
      </div>

      {/* Opacity Section */}
      <div className="space-y-4">
        <Typography variant="h2">Opacity</Typography>

        <div className="space-y-2">
          <Typography variant="body1" opacity={1}>
            Opacity 100%
          </Typography>
          <Typography variant="body1" opacity={0.8}>
            Opacity 80%
          </Typography>
          <Typography variant="body1" opacity={0.6}>
            Opacity 60%
          </Typography>
          <Typography variant="body1" opacity={0.4}>
            Opacity 40%
          </Typography>
          <Typography variant="body1" opacity={0.2}>
            Opacity 20%
          </Typography>
        </div>
      </div>

      {/* Component Override Section */}
      <div className="space-y-4">
        <Typography variant="h2">Component Override</Typography>

        <div className="space-y-2">
          <Typography variant="body1" component="h1">
            Body1 variant rendered as H1
          </Typography>
          <Typography variant="h1" component="span">
            H1 variant rendered as Span
          </Typography>
          <Typography variant="button" component="label">
            Button variant rendered as Label
          </Typography>
        </div>
      </div>

      {/* Complex Examples */}
      <div className="space-y-4">
        <Typography variant="h2">Complex Examples</Typography>

        <div className="space-y-2">
          <Typography
            variant="h3"
            color="primary"
            fontWeight="bold"
            textTransform="uppercase"
            textGradient
          >
            Complex Styling
          </Typography>

          <Typography variant="body1" color="success" fontWeight="medium" opacity={0.8}>
            Success message with medium weight and reduced opacity
          </Typography>

          <Typography variant="caption" color="warning" textTransform="capitalize">
            warning message in caption style
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default TypographyDemo
