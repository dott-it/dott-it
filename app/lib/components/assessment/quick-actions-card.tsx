import { Card, CardContent, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Assessment } from '@/types'
import { DownloadCloud, FileText, Eye, Notebook } from 'lucide-react'

interface QuickActionsCardProps {
  assessment: Assessment
}

export function QuickActionsCard({ assessment: _assessment }: QuickActionsCardProps) {
  const actions = [
    {
      label: 'Export Data',
      icon: <DownloadCloud className="size-4" />,
      onClick: () => {
        // TODO: Implement export functionality
      },
      variant: 'outline' as const,
    },
    {
      label: 'Generate Report',
      icon: <FileText className="size-4" />,
      onClick: () => {
        // TODO: Implement report generation
      },
      variant: 'outline' as const,
    },
    {
      label: 'Live Collection Screen',
      icon: <Eye className="size-4" />,
      onClick: () => {
        // TODO: Implement live collection screen
      },
      variant: 'outline' as const,
    },
    {
      label: 'Customize Form',
      icon: <Notebook className="size-4" />,
      onClick: () => {
        // TODO: Implement form customization
      },
      variant: 'outline' as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            size="sm"
            className="w-full justify-start"
            onClick={action.onClick}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
