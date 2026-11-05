import React from 'react'
import { Divider } from './divider'
import { Typography } from '../typography'

export function DividerDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <Typography variant="h3" className="mb-4">
          Divider Component Examples
        </Typography>

        <div className="space-y-6">
          {/* Simple divider */}
          <div>
            <Typography variant="h4" className="mb-2">
              Simple Divider
            </Typography>
            <Typography variant="body2" color="muted" className="mb-2">
              Just a horizontal line without text
            </Typography>
            <Divider />
          </div>

          {/* Divider with text */}
          <div>
            <Typography variant="h4" className="mb-2">
              Divider with Text
            </Typography>
            <Typography variant="body2" color="muted" className="mb-2">
              Horizontal line with centered text
            </Typography>
            <Divider>Or continue with</Divider>
          </div>

          {/* Divider with custom text */}
          <div>
            <Typography variant="h4" className="mb-2">
              Custom Text
            </Typography>
            <Typography variant="body2" color="muted" className="mb-2">
              Using different text content
            </Typography>
            <Divider>Section Break</Divider>
          </div>

          {/* Divider with complex content */}
          <div>
            <Typography variant="h4" className="mb-2">
              Complex Content
            </Typography>
            <Typography variant="body2" color="muted" className="mb-2">
              Supporting React elements as children
            </Typography>
            <Divider>
              <span className="font-semibold">Important</span> Section
            </Divider>
          </div>

          {/* Divider with custom styling */}
          <div>
            <Typography variant="h4" className="mb-2">
              Custom Styling
            </Typography>
            <Typography variant="body2" color="muted" className="mb-2">
              Applying custom classes
            </Typography>
            <Divider className="my-8" textClassName="text-blue-600 font-bold">
              Custom Styled
            </Divider>
          </div>
        </div>
      </div>
    </div>
  )
}
