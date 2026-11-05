'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UnitSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function UnitSearch({
  value,
  onChange,
  placeholder,
  className,
  'aria-label': ariaLabel,
}: UnitSearchProps) {
  return (
    <div className={className ?? 'relative max-w-md flex-1'}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? 'Search assessments, lessons, standards...'}
        className="pl-9 pr-9"
        aria-label={ariaLabel ?? 'Search within unit'}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
