import React from 'react'
import { SimplePageHeader } from './simple-page-header'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Plus, Settings, Download, Share, Filter } from 'lucide-react'

export function PageHeaderDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">PageHeader Component</h2>
        <p className="mb-6 text-muted-foreground">
          A reusable page header component with title, description, and configurable actions.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-xl font-semibold">Basic Examples</h3>

          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-lg font-medium">Title Only</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader title="Dashboard" />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Title with Description</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Workspace"
                    description="Manage your assessments and student responses"
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">With Single Action</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Assessments"
                    description="Create and manage your assessments"
                    actions={[
                      {
                        label: 'Create Assessment',
                        href: '/create',
                        icon: <Plus className="mr-2 size-4" />,
                        variant: 'primary',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">With Multiple Actions</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Reports"
                    description="View and download your assessment reports"
                    actions={[
                      {
                        label: 'Export',
                        onClick: () => alert('Export clicked!'),
                        icon: <Download className="mr-2 size-4" />,
                        variant: 'outline',
                      },
                      {
                        label: 'Share',
                        onClick: () => alert('Share clicked!'),
                        icon: <Share className="mr-2 size-4" />,
                        variant: 'secondary',
                      },
                      {
                        label: 'Settings',
                        href: '/settings',
                        icon: <Settings className="mr-2 size-4" />,
                        variant: 'ghost',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Button Variants</h3>
          <Card>
            <CardContent>
              <SimplePageHeader
                title="Button Variants Demo"
                description="Showcasing different button styles"
                actions={[
                  {
                    label: 'Primary',
                    onClick: () => alert('Primary clicked!'),
                    variant: 'primary',
                  },
                  {
                    label: 'Secondary',
                    onClick: () => alert('Secondary clicked!'),
                    variant: 'secondary',
                  },
                  {
                    label: 'Outline',
                    onClick: () => alert('Outline clicked!'),
                    variant: 'outline',
                  },
                  {
                    label: 'Ghost',
                    onClick: () => alert('Ghost clicked!'),
                    variant: 'ghost',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Real-world Examples</h3>

          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-lg font-medium">Dashboard Page</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Dashboard"
                    description="Overview of your account activity"
                    actions={[
                      {
                        label: 'Refresh',
                        onClick: () => alert('Refreshing...'),
                        variant: 'outline',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">User Management</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Users"
                    description="Manage user accounts and permissions"
                    actions={[
                      {
                        label: 'Filter',
                        onClick: () => alert('Filter opened!'),
                        icon: <Filter className="mr-2 size-4" />,
                        variant: 'outline',
                      },
                      {
                        label: 'Add User',
                        href: '/users/create',
                        icon: <Plus className="mr-2 size-4" />,
                        variant: 'primary',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Settings Page</h4>
              <Card>
                <CardContent>
                  <SimplePageHeader
                    title="Settings"
                    description="Configure your application preferences"
                    actions={[
                      {
                        label: 'Reset to Defaults',
                        onClick: () => alert('Reset confirmed!'),
                        variant: 'ghost',
                      },
                      {
                        label: 'Save Changes',
                        onClick: () => alert('Settings saved!'),
                        variant: 'primary',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Props Reference</h3>
          <Card>
            <CardHeader>
              <CardTitle>SimplePageHeaderProps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-4 border-b py-2">
                  <div className="font-medium">Prop</div>
                  <div className="font-medium">Type</div>
                  <div className="font-medium">Description</div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">title</code>
                  <code className="text-xs text-muted-foreground">string</code>
                  <span>Main page title (required)</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">description</code>
                  <code className="text-xs text-muted-foreground">string</code>
                  <span>Optional page description</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">actions</code>
                  <code className="text-xs text-muted-foreground">SimplePageHeaderAction[]</code>
                  <span>Array of action buttons</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">className</code>
                  <code className="text-xs text-muted-foreground">string</code>
                  <span>Additional CSS classes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>SimplePageHeaderAction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-4 border-b py-2">
                  <div className="font-medium">Prop</div>
                  <div className="font-medium">Type</div>
                  <div className="font-medium">Description</div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">label</code>
                  <code className="text-xs text-muted-foreground">string</code>
                  <span>Button text (required)</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">href</code>
                  <code className="text-xs text-muted-foreground">string</code>
                  <span>Link URL (use for navigation)</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">onClick</code>
                  <code className="text-xs text-muted-foreground">{'() => void'}</code>
                  <span>Click handler (use for actions)</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">icon</code>
                  <code className="text-xs text-muted-foreground">React.ReactNode</code>
                  <span>Optional icon element</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs">variant</code>
                  <code className="text-xs text-muted-foreground">
                    {"'primary' | 'secondary' | 'outline' | 'ghost'"}
                  </code>
                  <span>Button style variant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Usage Examples</h3>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle size="md">Basic Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
                  {`<SimplePageHeader 
  title="Dashboard" 
  description="Overview of your data"
/>`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">With Single Action</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
                  {`<SimplePageHeader 
  title="Users" 
  description="Manage user accounts"
  actions={[
    {
      label: 'Add User',
      href: '/users/create',
      icon: <Plus className="mr-2 size-4" />,
      variant: 'primary'
    }
  ]}
/>`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">With Multiple Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
                  {`<SimplePageHeader 
  title="Reports" 
  description="Export and share reports"
  actions={[
    {
      label: 'Export',
      onClick: handleExport,
      icon: <Download className="mr-2 size-4" />,
      variant: 'outline'
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="mr-2 size-4" />,
      variant: 'ghost'
    }
  ]}
/>`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
