'use client'

import { Button } from '@/app/lib/components/ui/buttons'
import { cn } from '@/lib/utils'
import type { SoftClass } from '@/lib/planner/build-planner-home'

export interface SoftClassFilterProps {
  classes: SoftClass[]
  value: string
  onChange: (key: string) => void
}

export function SoftClassFilter({ classes, value, onChange }: SoftClassFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by class">
      <Button
        type="button"
        size="sm"
        variant={value === 'all' ? 'default' : 'outline'}
        onClick={() => onChange('all')}
        className={cn(value === 'all' && 'pointer-events-none')}
      >
        All classes
      </Button>
      {classes.map((softClass) => (
        <Button
          key={softClass.key}
          type="button"
          size="sm"
          variant={value === softClass.key ? 'default' : 'outline'}
          onClick={() => onChange(softClass.key)}
        >
          {softClass.label}
        </Button>
      ))}
    </div>
  )
}
