import React from 'react'
import { Button } from './button-compounds'
import { ExternalLink, ArrowRight, Home, Settings } from 'lucide-react'

export function ButtonDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Compound Components</h2>
        <div className="flex flex-wrap gap-4">
          <Button.Primary>Primary</Button.Primary>
          <Button.Secondary>Secondary</Button.Secondary>
          <Button.Outline>Outline</Button.Outline>
          <Button.Ghost>Ghost</Button.Ghost>
          <Button.Destructive>Destructive</Button.Destructive>
          <Button.Link>Link</Button.Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Size Combinations</h2>
        <div className="flex flex-wrap gap-4">
          <Button.PrimarySmall>Primary Small</Button.PrimarySmall>
          <Button.PrimaryLarge>Primary Large</Button.PrimaryLarge>
          <Button.OutlineSmall>Outline Small</Button.OutlineSmall>
          <Button.OutlineLarge>Outline Large</Button.OutlineLarge>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Action Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button.Action>Full Width Action</Button.Action>
          <Button.ActionSmall>Small Action</Button.ActionSmall>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Navigation Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button.Nav>
            <Home className="mr-2 size-4" />
            Navigation Button
          </Button.Nav>
          <Button.NavSmall>
            <Settings className="mr-2 size-4" />
            Small Nav
          </Button.NavSmall>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Form Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button.Submit>Submit</Button.Submit>
          <Button.Cancel>Cancel</Button.Cancel>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Buttons with URLs - Internal Links</h2>
        <div className="flex flex-wrap gap-4">
          <Button href="/dashboard">Go to Dashboard</Button>
          <Button.Primary href="/settings">Settings</Button.Primary>
          <Button.Outline href="/profile">Profile</Button.Outline>
          <Button.Ghost href="/help">Help</Button.Ghost>
          <Button.Link href="/about">About</Button.Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Buttons with URLs - External Links</h2>
        <div className="flex flex-wrap gap-4">
          <Button href="https://github.com" external>
            GitHub
            <ExternalLink className="size-4" />
          </Button>
          <Button.Primary href="https://docs.example.com" external>
            Documentation
            <ExternalLink className="size-4" />
          </Button.Primary>
          <Button.Outline href="https://support.example.com" external>
            Support
            <ExternalLink className="size-4" />
          </Button.Outline>
          <Button.Ghost href="https://blog.example.com" external>
            Blog
            <ArrowRight className="size-4" />
          </Button.Ghost>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Compound Components with URLs</h2>
        <div className="flex flex-wrap gap-4">
          <Button.PrimarySmall href="/quick-action">Quick Action</Button.PrimarySmall>
          <Button.OutlineLarge href="/important-page">Important Page</Button.OutlineLarge>
          <Button.Action href="/main-action">Main Action</Button.Action>
          <Button.Nav href="/navigation">
            <Home className="mr-2 size-4" />
            Navigation Link
          </Button.Nav>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Interactive Examples</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => alert('Button clicked!')} href="/dashboard">
              Click me (button behavior)
            </Button>
            <Button
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault()
                alert('Link prevented, custom action!')
              }}
            >
              Custom Link Action
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
