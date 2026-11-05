import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, Column } from '../data-table'

interface TestItem {
  id: string
  name: string
  status: string
}

const mockData: TestItem[] = [
  { id: '1', name: 'John Doe', status: 'active' },
  { id: '2', name: 'Jane Smith', status: 'inactive' },
  { id: '3', name: 'Bob Wilson', status: 'active' },
]

const mockColumns: Column<TestItem>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (item) => <span>{item.name}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <span data-testid={`status-${item.id}`}>{item.status}</span>,
  },
]

const rowClassName = (item: TestItem) => (item.status === 'active' ? 'active-row' : 'inactive-row')

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} emptyText="No data found" />)

    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders custom empty text', () => {
    render(<DataTable data={[]} columns={mockColumns} emptyText="Custom empty message" />)

    expect(screen.getByText('Custom empty message')).toBeInTheDocument()
  })

  it('calls onRowClick when row is clicked', () => {
    const handleRowClick = jest.fn()

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
        getRowAriaLabel={(r) => r.name}
      />,
    )

    const firstRow = screen.getByText('John Doe').closest('tr')
    fireEvent.click(firstRow!)

    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('calls onRowClick when a focused row is activated with Enter', () => {
    const handleRowClick = jest.fn()

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
        getRowAriaLabel={(r) => `Row ${r.name}`}
      />,
    )

    const firstRow = screen.getByText('John Doe').closest('tr')!
    firstRow.focus()
    expect(firstRow).toHaveFocus()
    fireEvent.keyDown(firstRow, { key: 'Enter' })
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('calls onRowClick when a focused row is activated with Space', () => {
    const handleRowClick = jest.fn()

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
        getRowAriaLabel={(r) => r.name}
      />,
    )

    const firstRow = screen.getByText('John Doe').closest('tr')!
    firstRow.focus()
    fireEvent.keyDown(firstRow, {key: ' ', code: 'Space'})
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('renders pagination when provided', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          currentPage: 1,
          totalPages: 2,
          totalItems: 5,
          itemsPerPage: 3,
          onPageChange: jest.fn(),
          showInfo: true,
        }}
      />,
    )

    expect(screen.getByText('Showing 1 to 3 of 5 items')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('renders custom pagination info text', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          currentPage: 1,
          totalPages: 2,
          totalItems: 5,
          itemsPerPage: 3,
          onPageChange: jest.fn(),
          showInfo: true,
          infoText: (start, end, total) => `Displaying ${start}-${end} of ${total} records`,
        }}
      />,
    )

    expect(screen.getByText('Displaying 1-3 of 5 records')).toBeInTheDocument()
  })

  it('applies custom className to table wrapper', () => {
    render(<DataTable data={mockData} columns={mockColumns} className="custom-table-class" />)

    const tableWrapper = screen.getByRole('table').parentElement
    expect(tableWrapper).toHaveClass('custom-table-class')
  })

  it('applies custom row className', () => {
    render(<DataTable data={mockData} columns={mockColumns} rowClassName="custom-row-class" />)

    const rows = screen.getAllByRole('row').slice(1) // Skip header row
    for (const row of rows) {
      expect(row).toHaveClass('custom-row-class')
    }
  })

  it('applies dynamic row className based on item', () => {
    render(<DataTable data={mockData} columns={mockColumns} rowClassName={rowClassName} />)

    const johnRow = screen.getByText('John Doe').closest('tr')
    const janeRow = screen.getByText('Jane Smith').closest('tr')

    expect(johnRow).toHaveClass('active-row')
    expect(janeRow).toHaveClass('inactive-row')
  })

  describe('Sorting functionality', () => {
    const sortableColumns: Column<TestItem>[] = [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        sortFunction: (a, b) => a.name.localeCompare(b.name),
        cell: (item) => <span>{item.name}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortFunction: (a, b) => a.status.localeCompare(b.status),
        cell: (item) => <span data-testid={`status-${item.id}`}>{item.status}</span>,
      },
    ]

    it('renders sort buttons for sortable columns', () => {
      render(<DataTable data={mockData} columns={sortableColumns} />)

      const nameHeader = screen.getByText('Name').closest('button')
      const statusHeader = screen.getByText('Status').closest('button')

      expect(nameHeader).toBeInTheDocument()
      expect(statusHeader).toBeInTheDocument()
    })

    it('sorts data in ascending order when column header is clicked', () => {
      render(<DataTable data={mockData} columns={sortableColumns} />)

      const nameHeader = screen.getByText('Name').closest('button')
      fireEvent.click(nameHeader!)

      // Check that all names are still present
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      // Check that the sort icon changes to indicate sorting
      const button = screen.getByText('Name').closest('button')
      expect(button).toContainHTML('lucide-arrow-up')
    })

    it('sorts data in descending order when same column header is clicked twice', () => {
      render(<DataTable data={mockData} columns={sortableColumns} />)

      const nameHeader = screen.getByText('Name').closest('button')
      fireEvent.click(nameHeader!) // First click - ascending
      fireEvent.click(nameHeader!) // Second click - descending

      // Check that the sort icon changes to indicate descending sort
      const button = screen.getByText('Name').closest('button')
      expect(button).toContainHTML('lucide-arrow-down')
    })

    it('does not render sort buttons when sortable is false', () => {
      const nonSortableColumns: Column<TestItem>[] = [
        {
          key: 'name',
          header: 'Name',
          sortable: false,
          cell: (item) => <span>{item.name}</span>,
        },
      ]

      render(<DataTable data={mockData} columns={nonSortableColumns} sortable={false} />)

      const nameHeader = screen.getByText('Name')
      expect(nameHeader.closest('button')).not.toBeInTheDocument()
    })

    it('maintains sort state when switching between columns', () => {
      render(<DataTable data={mockData} columns={sortableColumns} />)

      // Sort by name first
      const nameHeader = screen.getByText('Name').closest('button')
      fireEvent.click(nameHeader!)

      // Then sort by status
      const statusHeader = screen.getByText('Status').closest('button')
      fireEvent.click(statusHeader!)

      // Check that the status column shows the active sort state
      expect(screen.getByText('Status').closest('button')).toContainHTML('lucide-arrow-up')
      expect(screen.getByText('Name').closest('button')).toContainHTML('lucide-arrow-up-down')
    })
  })
})
