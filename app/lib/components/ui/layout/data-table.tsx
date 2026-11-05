import React, { ReactNode, useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  cell: (item: T) => ReactNode
  className?: string
  sortable?: boolean
  sortFunction?: (a: T, b: T) => number
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  infoText?: (start: number, end: number, total: number) => string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  emptyText?: string
  emptyIcon?: ReactNode
  pagination?: PaginationProps
  className?: string
  onRowClick?: (item: T) => void
  /** Screen reader label for clickable rows; strongly recommended when using `onRowClick`. */
  getRowAriaLabel?: (item: T) => string
  rowClassName?: string | ((item: T) => string)
  /** Optional hover background for rows (e.g. hover:bg-green-50). When provided, overrides default hover. */
  rowHoverClassName?: string
  loading?: boolean
  loadingSkeleton?: ReactNode
  sortable?: boolean
  externalPagination?: boolean
  // External sorting props
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (columnKey: string) => void
}

export function DataTable<T>({
  data,
  columns,
  emptyText = 'No data available',
  emptyIcon,
  pagination,
  className = '',
  onRowClick,
  getRowAriaLabel,
  rowClassName,
  rowHoverClassName,
  loading = false,
  loadingSkeleton,
  sortable = true,
  externalPagination = false,
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  onSort,
}: DataTableProps<T>) {
  const [internalSortColumn, setInternalSortColumn] = useState<string | null>(null)
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc')

  // Use external sorting props if provided, otherwise use internal state
  const sortColumn = externalSortColumn ?? internalSortColumn
  const sortDirection = externalSortDirection ?? internalSortDirection

  // Sort data based on current sort state
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortable) return data

    const column = columns.find(col => col.key === sortColumn)
    if (!column?.sortable || !column.sortFunction) return data

    return [...data].sort((a, b) => {
      const result = column.sortFunction!(a, b)
      return sortDirection === 'asc' ? result : -result
    })
  }, [data, sortColumn, sortDirection, columns, sortable])

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable || !column.sortFunction) return

    if (onSort) {
      // Use external sorting handler
      onSort(columnKey)
    } else {
      // Use internal sorting state
      if (internalSortColumn === columnKey) {
        // Toggle direction if same column
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        // New column, default to ascending
        setInternalSortColumn(columnKey)
        setInternalSortDirection('asc')
      }
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="size-4 text-muted-foreground" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="size-4 text-primary" />
      : <ArrowDown className="size-4 text-primary" />
  }

  const getHeaderAriaSort = (column: Column<T>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!column.sortable || !sortable) return undefined
    if (sortColumn !== column.key) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        {loadingSkeleton || (
          <div className="animate-pulse">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-left font-medium">
                      <div className="h-4 bg-muted rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-muted-foreground">{emptyText}</p>
      </div>
    )
  }

  const getRowClassName = (item: T) => {
    const hoverClass = rowHoverClassName ?? 'hover:bg-muted/50'
    const baseClass = `border-b ${hoverClass}`
    const clickableClass = onRowClick
      ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      : ''
    
    let customClass = ''
    if (typeof rowClassName === 'function') {
      customClass = rowClassName(item)
    } else if (typeof rowClassName === 'string') {
      customClass = rowClassName
    }
    
    return `${baseClass} ${clickableClass} ${customClass}`.trim()
  }

  const renderPaginationInfo = () => {
    if (!pagination || !pagination.showInfo) return null
    
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage + 1
    const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)
    const text = pagination.infoText 
      ? pagination.infoText(start, end, pagination.totalItems)
      : `Showing ${start} to ${end} of ${pagination.totalItems} items`
    
    return <div className="text-sm text-muted">{text}</div>
  }

  return (
    <>
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={`px-4 py-3 text-left text-muted-foreground font-medium ${column.className || ''}`}
                  aria-sort={getHeaderAriaSort(column)}
                >
                  {column.sortable && sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                      title={`Sort by ${column.header}`}
                    >
                      <span>{column.header}</span>
                      {getSortIcon(column.key)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr 
                key={index}
                className={getRowClassName(item)}
                {...(onRowClick
                  ? {
                      tabIndex: 0,
                      onClick: () => {
                        onRowClick(item)
                      },
                      onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(item)
                        }
                      },
                      'aria-label': getRowAriaLabel?.(item) ?? 'View row details',
                    }
                  : {})}
              >
                {columns.map((column) => (
                <td 
                  key={column.key} 
                  className={`px-4 py-4 ${column.className || ''}`}
                >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && pagination.totalPages > 1 && !externalPagination && (
        <div className="flex items-center justify-between mt-6">
          {renderPaginationInfo()}
          <PaginationControls 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </>
  )
}

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        Next
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
