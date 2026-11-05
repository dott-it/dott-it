import React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  className?: string
  containerClassName?: string
  iconClassName?: string
}

export function SearchInput({
  placeholder = 'Search...',
  className,
  containerClassName,
  iconClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search
        className={cn(
          'absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground',
          iconClassName,
        )}
      />
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary',
          className,
        )}
        {...props}
      />
    </div>
  )
}
