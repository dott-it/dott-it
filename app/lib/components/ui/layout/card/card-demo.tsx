import React from 'react'
import { Button } from '../../buttons/button-compounds'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './index'
import { Settings, Download, Eye, Edit, Plus, Book, Users } from 'lucide-react'

export function CardDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Card Variants</h2>
        <p className="mb-6 text-muted-foreground">
          Cards now have enhanced shadows for better visual separation. Hover over them to see the
          shadow effect!
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Enhanced shadow with hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here with default styling and medium shadow.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle>Outline Card</CardTitle>
              <CardDescription>Subtle shadow with hover enhancement</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content with outline styling and subtle shadow.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                Action
              </Button>
            </CardFooter>
          </Card>

          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost Card</CardTitle>
              <CardDescription>No shadow, appears on hover</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content with ghost styling - shadow appears on hover.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">
                Action
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Card Sizes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding="sm">
            <CardHeader padding="sm">
              <CardTitle size="md">Small Card</CardTitle>
              <CardDescription size="sm">Small padding variant</CardDescription>
            </CardHeader>
            <CardContent padding="sm" hasHeader>
              <p className="text-sm">Compact content area.</p>
            </CardContent>
            <CardFooter padding="sm" hasContent>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card padding="md">
            <CardHeader padding="md">
              <CardTitle size="lg">Medium Card</CardTitle>
              <CardDescription size="md">Medium padding variant</CardDescription>
            </CardHeader>
            <CardContent padding="md" hasHeader>
              <p>Standard content area.</p>
            </CardContent>
            <CardFooter padding="md" hasContent>
              <Button>Action</Button>
            </CardFooter>
          </Card>

          <Card padding="lg">
            <CardHeader padding="lg">
              <CardTitle size="xl">Large Card</CardTitle>
              <CardDescription size="lg">Large padding variant</CardDescription>
            </CardHeader>
            <CardContent padding="lg" hasHeader>
              <p>Spacious content area.</p>
            </CardContent>
            <CardFooter padding="lg" hasContent>
              <Button size="lg">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Card Title Sizes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle size="sm" as="h4">
                Small Title
              </CardTitle>
              <CardDescription>Small title variant</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="md" as="h3">
                Medium Title
              </CardTitle>
              <CardDescription>Medium title variant</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="lg" as="h3">
                Large Title
              </CardTitle>
              <CardDescription>Large title variant</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="xl" as="h2">
                Extra Large
              </CardTitle>
              <CardDescription>Extra large title variant</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="2xl" as="h1">
                2XL Title
              </CardTitle>
              <CardDescription>2XL title variant</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Card Description Colors</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Default Color</CardTitle>
              <CardDescription color="default">
                This description uses the default color
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Muted Color</CardTitle>
              <CardDescription color="muted">This description uses the muted color</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtle Color</CardTitle>
              <CardDescription color="subtle">
                This description uses the subtle color
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Card Footer Alignment</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <p>Card with left-aligned footer</p>
            </CardContent>
            <CardFooter align="left">
              <Button size="sm">Left</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardContent>
              <p>Card with center-aligned footer</p>
            </CardContent>
            <CardFooter align="center">
              <Button size="sm">Center</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardContent>
              <p>Card with right-aligned footer</p>
            </CardContent>
            <CardFooter align="right">
              <Button size="sm">Right</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardContent>
              <p>Card with space-between footer</p>
            </CardContent>
            <CardFooter align="between">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Real-world Examples</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Assessment Card */}
          <Card>
            <CardHeader>
              <CardTitle size="lg">Science Assessment</CardTitle>
              <CardDescription>Unit 3: Ecosystems</CardDescription>
            </CardHeader>
            <CardContent hasHeader>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Records:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending:</span>
                  <span className="font-medium text-orange-600">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Due Date:</span>
                  <span className="font-medium">Dec 15, 2024</span>
                </div>
              </div>
            </CardContent>
            <CardFooter hasContent>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="size-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="size-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="size-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader padding="sm">
              <div className="flex items-center justify-between">
                <CardTitle size="md">Total Students</CardTitle>
                <Users className="size-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent padding="sm" hasHeader>
              <div className="text-3xl font-bold text-blue-600">156</div>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle size="lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent hasHeader>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <Plus className="mr-2 size-4" />
                  Create Assessment
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Book className="mr-2 size-4" />
                  Browse Library
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 size-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle size="lg">Assessment Settings</CardTitle>
              <CardDescription>Configure your assessment preferences</CardDescription>
            </CardHeader>
            <CardContent hasHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assessment Name</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Enter assessment name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter hasContent align="between">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Alert Card */}
          <Card variant="outline" className="border-orange-200 bg-orange-50">
            <CardHeader padding="sm">
              <CardTitle size="md" className="text-orange-800">
                Pending Reviews
              </CardTitle>
              <CardDescription color="subtle" className="text-orange-700">
                You have 5 assessments waiting for review
              </CardDescription>
            </CardHeader>
            <CardContent padding="sm" hasHeader>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Review Now
              </Button>
            </CardContent>
          </Card>

          {/* Empty State Card */}
          <Card variant="ghost" className="text-center">
            <CardContent className="py-12">
              <Book className="mx-auto mb-4 size-12 text-muted-foreground" />
              <CardTitle size="lg">No Assessments</CardTitle>
              <CardDescription className="mx-auto max-w-sm">
                You haven&apos;t created any assessments yet. Get started by creating your first one.
              </CardDescription>
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 size-4" />
                  Create Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
