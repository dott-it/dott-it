import React from 'react'
import { LoginCard, StatsCard, AssessmentCard, EmptyStateCard, AlertCard } from './index'
import { Button } from '../../buttons/button-compounds'
import { FormField } from '../../../index'
import { Book, Users, AlertCircle, CheckCircle, Bell } from 'lucide-react'

export function CardsDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Specific Card Components</h2>
        <p className="mb-6 text-muted-foreground">
          Each card component is designed for a specific use case, eliminating the need for
          className props.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">LoginCard</h3>
        <p className="mb-4 text-muted-foreground">
          Automatically centered card with proper styling for login forms.
        </p>
        <div className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300">
          <LoginCard title="Demo Login" subtitle="This is how the login card looks">
            <form className="space-y-4">
              <FormField
                label="Email"
                type="email"
                placeholder="user@example.com"
                value=""
                onChange={() => {}}
              />
              <FormField
                label="Password"
                type="password"
                placeholder="••••••••"
                value=""
                onChange={() => {}}
              />
              <Button className="w-full">Sign In</Button>
            </form>
          </LoginCard>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">StatsCard</h3>
        <p className="mb-4 text-muted-foreground">
          Perfect for displaying statistics with optional icons.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Users"
            value="1,234"
            description="+12% from last month"
            icon={Users}
            iconColor="text-blue-600"
            valueColor="text-blue-600"
          />
          <StatsCard
            title="Active Sessions"
            value="89"
            description="Currently online"
            icon={AlertCircle}
            iconColor="text-green-600"
            valueColor="text-green-600"
          />
          <StatsCard
            title="Pending Reviews"
            value="23"
            description="Needs attention"
            icon={Bell}
            iconColor="text-orange-600"
            valueColor="text-orange-600"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">AssessmentCard</h3>
        <p className="mb-4 text-muted-foreground">
          Specialized card for displaying assessment information with actions.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <AssessmentCard
            title="Science Assessment"
            description="Unit 3: Ecosystems"
            totalRecords={24}
            pendingRecords={8}
            dueDate="Dec 15, 2024"
            onView={() => alert('Viewing assessment')}
            onEdit={() => alert('Editing assessment')}
            onDelete={() => alert('Deleting assessment')}
          />
          <AssessmentCard
            title="Math Quiz"
            description="Chapter 5: Algebra"
            totalRecords={45}
            pendingRecords={12}
            dueDate="Dec 20, 2024"
            href="/assessments/math-quiz"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">AlertCard</h3>
        <p className="mb-4 text-muted-foreground">
          Contextual cards for different types of messages.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AlertCard
            variant="success"
            title="Success"
            description="Operation completed successfully"
            icon={CheckCircle}
          >
            <p>Your changes have been saved.</p>
          </AlertCard>

          <AlertCard
            variant="warning"
            title="Warning"
            description="Please review your input"
            icon={AlertCircle}
          >
            <p>Some fields may need attention.</p>
          </AlertCard>

          <AlertCard
            variant="error"
            title="Error"
            description="Something went wrong"
            icon={AlertCircle}
          >
            <p>Please try again later.</p>
          </AlertCard>

          <AlertCard
            variant="info"
            title="Information"
            description="Helpful tip"
            icon={AlertCircle}
          >
            <p>Here&apos;s some useful information.</p>
          </AlertCard>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">EmptyStateCard</h3>
        <p className="mb-4 text-muted-foreground">
          Perfect for showing empty states with optional actions.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyStateCard
            icon={Book}
            title="No Assessments"
            description="You haven&apos;t created any assessments yet. Get started by creating your first one."
            actionLabel="Create Assessment"
            onAction={() => alert('Creating assessment')}
          />
          <EmptyStateCard
            icon={Users}
            title="No Students"
            description="Invite students to join your workspace and start collaborating."
            actionLabel="Invite Students"
            actionHref="/invite"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Usage Examples</h3>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-2 font-medium">Login Page</h4>
            <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
              {`<LoginCard>
  <form>
    <FormField label="Email" type="email" />
    <FormField label="Password" type="password" />
    <Button className="w-full">Sign In</Button>
  </form>
</LoginCard>`}
            </pre>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-2 font-medium">Dashboard Stats</h4>
            <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
              {`<StatsCard
  title="Total Users"
  value="1,234"
  description="+12% from last month"
  icon={Users}
  iconColor="text-blue-600"
  valueColor="text-blue-600"
/>`}
            </pre>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-2 font-medium">Assessment List</h4>
            <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
              {`<AssessmentCard
  title="Science Assessment"
  description="Unit 3: Ecosystems"
  totalRecords={24}
  pendingRecords={8}
  dueDate="Dec 15, 2024"
  href="/assessments/science"
/>`}
            </pre>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-2 font-medium">Empty State</h4>
            <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
              {`<EmptyStateCard
  icon={Book}
  title="No Items Found"
  description="Get started by creating your first item."
  actionLabel="Create Item"
  onAction={() => createItem()}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
