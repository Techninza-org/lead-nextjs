"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, Search, X, ChevronRight, Calendar } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { capitalizeFirstLetter, isValidUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { usePermissions } from "./providers/PermissionContext"
import { useModal } from "@/hooks/use-modal-store"
import { format, isWithinInterval, parseISO } from "date-fns"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

export const getSortableHeader = (
  columnId: string,
  label: string,
  index: number,
  updateSortInUrl: (index: number, isDesc: boolean | null, e: React.MouseEvent<HTMLButtonElement>) => void,
  searchParams: URLSearchParams
) => {
  const SortableHeader = () => {
    const currentSort = searchParams.get("sort") || ""
    const sortArray = currentSort.split(",")
    const columnSort = sortArray.find(s => Math.abs(parseInt(s)) === (index + 1))
    const isDesc = columnSort && columnSort.startsWith("-")
    const sortOrder = sortArray.findIndex(s => Math.abs(parseInt(s)) === (index + 1))
    const orderLabel = sortOrder >= 0 ? `(${sortOrder + 1})` : ''

    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={(e) => {
            const newIsDesc = columnSort ? !isDesc : false
            updateSortInUrl(index, newIsDesc, e)
          }}
          className="p-0 h-auto flex items-center gap-1"
        >
          {label} {orderLabel}
          {columnSort ? (
            isDesc ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
          )}
        </Button>
        {columnSort && (
          <Button
            size={'icon'}
            variant={'ghost'}
            onClick={(e) => updateSortInUrl(index, null, e)}
            className="p-0 text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  SortableHeader.displayName = `SortableHeader(${columnId})`
  return SortableHeader
}



// ----------------- Filters -----------------
export const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue.length) return true
  const cellValue = row.getValue(columnId)
  return filterValue.includes(String(cellValue))
}

// --------------- Component -----------------
export default function AdvancedDataTableForms({
  leadProspectCols = [],
  data = [],
  columnNames = [],
  changeView = [],
  dependentCols = [],
  MoreInfo,
  tableName,
  showTools = true,
  onUnselectedRowsChange,
  pagination = { total: data.length, page: 1, limit: 10, totalPages: Math.ceil(data.length / 10) },
  sortParam,
  updateSortInUrl,
  searchParams,
  pathname
}: {
  data: any[]
  columnNames: string[]
  changeView: string[]
  tableName: string
  dependentCols?: string[]
  leadProspectCols?: any[]
  MoreInfo?: any
  showTools?: boolean
  onUnselectedRowsChange?: (ids: string[]) => void
  pagination?: { total: number; page: number; limit: number; totalPages: number }
  sortParam: string
updateSortInUrl: (index: number, isDesc: boolean | null, e: React.MouseEvent) => void
searchParams: URLSearchParams
pathname: string
}) {
  // ----------------- Local state -----------------
  const [currentPage, setCurrentPage] = React.useState(pagination.page)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [selectedColumn, setSelectedColumn] = React.useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [allSelected, setAllSelected] = React.useState(false) // master flag
  const [unselectedRows, setUnselectedRows] = React.useState<string[]>([]) // exceptions when allSelected=true
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[] | { start?: string; end?: string }>>({})
  const [searchFilters, setSearchFilters] = React.useState<Record<string, string>>({})
  const [columnOrder, setColumnOrder] = React.useState<string[]>([])
  const [companyFunctions, setCompanyFunctions] = React.useState<any[]>([])

  const { checkPermission } = usePermissions()
  const { onOpen } = useModal()

  // ----------------- Pagination slice -----------------
  const rowsPerPage = pagination.limit
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return data.slice(start, start + rowsPerPage)
  }, [data, currentPage, rowsPerPage])

  // ----------------- Parent notify helper -----------------
  const lastSentRef = React.useRef<string>("")
  const pushToParent = React.useCallback(
    (val: string[]) => {
      if (!onUnselectedRowsChange) return
      const json = JSON.stringify(val)
      if (lastSentRef.current === json) return
      lastSentRef.current = json
      onUnselectedRowsChange(val)
    },
    [onUnselectedRowsChange]
  )

  // ----------------- Columns -----------------
  const columns: ColumnDef<any>[] = leadProspectCols.length
    ? leadProspectCols
    : generateColumns({
        columnNames,
        dependentCols,
        tableName,
        changeView, // array of modal keys, e.g. ["viewLeadInfo"]
        onOpen,
        hasCreatePermission: checkPermission(`CREATE:${tableName.toUpperCase()}`),
        updateSortInUrl,
        searchParams,
      })

  // ----------------- React Table -----------------
  const table = useReactTable({
    data: paginatedData,
    columns,
    getRowId: (originalRow) => String(originalRow._id),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      // centralize selection changes from checkboxes
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater
        if (!allSelected) {
          // compute unselected when in normal mode
          const selectedIds = Object.keys(next).filter((id) => next[id])
          const allRowIds = allIdsRef.current
          const unselected = allRowIds.filter((id) => !selectedIds.includes(id))
          pushToParent(unselected)
        }
        return next
      })
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    filterFns: {
      multiSelect: multiSelectFilter,
    },
    getRowCanExpand: () => true,
  })

  // keep column order once
  React.useEffect(() => {
    setColumnOrder(table.getAllLeafColumns().map((d) => d.id))
  }, [table])

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  // --------------- Selection helpers ---------------
  const allIdsRef = React.useRef<string[]>([])
  React.useEffect(() => {
    allIdsRef.current = data.map((r) => String(r._id))
  }, [data])

  const toggleRow = (rowId: string) => {
    if (allSelected) {
      setUnselectedRows((prev) => {
        const next = prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
        pushToParent(next)
        return next
      })
    } else {
      setRowSelection((prev) => {
        const next = { ...prev, [rowId]: !prev[rowId] }
        const selectedIds = Object.keys(next).filter((id) => next[id])
        const unselected = allIdsRef.current.filter((id) => !selectedIds.includes(id))
        pushToParent(unselected)
        return next
      })
    }
  }

  const toggleSelectAllRows = () => {
    if (allSelected) {
      // switching OFF master select
      setAllSelected(false)
      setUnselectedRows([])
      setRowSelection({})
      pushToParent(allIdsRef.current) // now everything is unselected
    } else {
      // switching ON master select
      setAllSelected(true)
      setUnselectedRows([])
      setRowSelection(allIdsRef.current.reduce((acc, id) => ({ ...acc, [id]: true }), {}))
      pushToParent([]) // none unselected
    }
  }

  const isRowSelected = React.useCallback(
    (rowId: string) => (allSelected ? !unselectedRows.includes(rowId) : !!rowSelection[rowId]),
    [allSelected, unselectedRows, rowSelection]
  )

  // --------------- Filters ---------------
  const totalPages = Math.ceil(pagination.total / rowsPerPage)

  const handleFilterChange = (columnId: string, filterValue: string | { start?: string; end?: string }) => {
    if (columnId === "createdAt") {
      setActiveFilters((prev) => ({
        ...prev,
        [columnId]: filterValue as any,
      }))

      const column = table.getColumn(columnId)
      column?.setFilterValue(filterValue)
    } else {
      setActiveFilters((prev) => ({
        ...prev,
        [columnId]: Array.isArray(prev[columnId]) ? [...(prev[columnId] as string[]), filterValue as string] : [filterValue as string],
      }))

      const column = table.getColumn(columnId)
      if (column) {
        const currentFilterValue = (column.getFilterValue() as string[]) || []
        column.setFilterValue([...currentFilterValue, filterValue])
      }
    }
  }

  const removeFilter = (columnId: string, filterValue?: string) => {
    if (columnId === "createdAt") {
      setActiveFilters((prev) => {
        const newFilters = { ...prev }
        delete newFilters[columnId]
        return newFilters
      })
      table.getColumn(columnId)?.setFilterValue(undefined)
    } else {
      setActiveFilters((prev) => ({
        ...prev,
        [columnId]: Array.isArray(prev[columnId])
          ? (prev[columnId] as string[]).filter((value) => value !== filterValue)
          : prev[columnId],
      }))

      const column = table.getColumn(columnId)
      if (column) {
        const currentFilterValue = (column.getFilterValue() as string[]) || []
        column.setFilterValue(currentFilterValue.filter((value) => value !== filterValue))
      }
    }
  }

  const getColumnBackground = (columnId: string) => {
    if (columnId === "select" || columnId === "skuCode" || columnId === "expander") {
      return "bg-white"
    }
    const column: any = columns.find((col: any) => col.accessorKey === columnId)
    if (!column?.meta?.group) return ""

    switch (column.meta.group) {
      case "sales":
        return "bg-orange-50"
      case "inventory":
        return "bg-blue-50"
      case "purchase":
        return "bg-green-50"
      case "order":
        return "bg-purple-50"
      default:
        return ""
    }
  }

  const ExpandedRowContent = ({ row, dependentCols }: { row: any; dependentCols: string[] }) => {
    const dependentValue = row.original.dependentValue

    return (
      <Card className="w-full max-w-3xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[...dependentCols, "Created At"].map((col) => (
                  <TableHead key={col} className="text-center">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {dependentCols.map((col) => (
                  <TableCell key={col} className="text-center">
                    {dependentValue[col]}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(dependentValue.createdAt).toLocaleString()}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  // ----------------- Render -----------------
  return (
    <div className="space-y-4">
      {/* Tools */}
      {showTools && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Search className="mr-2 h-4 w-4" />
                Search Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px]">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium leading-none">Search Columns</h4>
                    <p className="text-sm text-muted-foreground mt-1">Select columns to filter the table</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setActiveFilters({})
                      table.getAllColumns().forEach((column) => column.setFilterValue(""))
                    }}
                  >
                    clear all
                  </Button>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="grid gap-2">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanFilter() || column.id === "skuCode")
                      .map((column) => {
                        const activeFilterCount = Array.isArray(activeFilters[column.id])
                          ? (activeFilters[column.id] as string[]).length
                          : activeFilters[column.id] && typeof activeFilters[column.id] === "object"
                          ? 1
                          : 0

                        return (
                          <Popover key={column.id}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between group">
                                <div className="flex items-center gap-2">
                                  {column.id}
                                  {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="rounded-full">
                                      {activeFilterCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  {activeFilterCount > 0 && (
                                    <X
                                      className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveFilters((prev) => ({ ...prev, [column.id]: [] }))
                                        column.setFilterValue("")
                                      }}
                                    />
                                  )}
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                              <div className="p-2">
                                {column.id === "createdAt" ? (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Start Date</Label>
                                      <Input
                                        type="datetime-local"
                                        onChange={(e) => {
                                          const startDate = e.target.value
                                          const currentFilter = (column.getFilterValue() as { start?: string; end?: string }) || {}
                                          const newFilter = { ...currentFilter, start: startDate }
                                          handleFilterChange(column.id, newFilter)
                                        }}
                                        value={((column.getFilterValue() as { start?: string }) || {}).start || ""}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>End Date</Label>
                                      <Input
                                        type="datetime-local"
                                        onChange={(e) => {
                                          const endDate = e.target.value
                                          const currentFilter = (column.getFilterValue() as { start?: string; end?: string }) || {}
                                          const newFilter = { ...currentFilter, end: endDate }
                                          handleFilterChange(column.id, newFilter)
                                        }}
                                        value={((column.getFilterValue() as { end?: string }) || {}).end || ""}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <Input
                                      placeholder={`Search ${column.id}...`}
                                      value={searchFilters[column.id] ?? ""}
                                      onChange={(event) =>
                                        setSearchFilters((prev) => ({
                                          ...prev,
                                          [column.id]: event.target.value,
                                        }))
                                      }
                                      className="max-w-sm mb-2"
                                    />
                                    <div className="max-h-[200px] overflow-auto">
                                      {Array.from(
                                        new Set(
                                          table
                                            .getFilteredRowModel()
                                            .rows.map((row) => String(row.original[column.id as any]))
                                            .filter((value) =>
                                              value.toLowerCase().includes((searchFilters[column.id] ?? "").toLowerCase())
                                            )
                                        )
                                      ).map((value) => (
                                        <div key={value} className="flex items-center gap-2 py-1">
                                          <Checkbox
                                            checked={Array.isArray(activeFilters[column.id]) && (activeFilters[column.id] as string[]).includes(value)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                handleFilterChange(column.id, value)
                                              } else {
                                                removeFilter(column.id, value)
                                              }
                                            }}
                                          />
                                          {value}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )
                      })}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="secondary">Rows/page: {rowsPerPage}</Button>
          <Button variant="secondary">Total Rows: {pagination.total}</Button>
        </div>
        {pagination.total > rowsPerPage && (
          <Button
            className="ml-4"
            size="sm"
            variant={allSelected ? "destructive" : "outline"}
            onClick={toggleSelectAllRows}
          >
            {allSelected ? "Clear All" : `Select All (${allIdsRef.current.length})`}
          </Button>
        )}
        {MoreInfo && <MoreInfo selectedLeads={selectedRows} />}
      </div>

      {/* Active Filters Badges */}
      {Object.entries(activeFilters).map(([columnId, filters]) => {
        if (columnId === "createdAt" && typeof filters === "object") {
          const { start, end } = filters as { start?: string; end?: string }
          return (
            <Badge key={`${columnId}-date-range`} variant="secondary" className="mr-2">
              {`${columnId}: ${start ? format(parseISO(start), "yyyy-MM-dd HH:mm") : "Start"} to ${
                end ? format(parseISO(end), "yyyy-MM-dd HH:mm") : "End"
              }`}
              <Button variant="ghost" onClick={() => removeFilter(columnId)} className="ml-1 h-auto p-0 text-base">
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )
        }
        return (
          Array.isArray(filters) &&
          (filters as string[]).map((filter) => (
            <Badge key={`${columnId}-${filter}`} variant="secondary" className="mr-2">
              {columnId}: {filter}
              <Button
                variant="ghost"
                onClick={() => removeFilter(columnId, filter)}
                className="ml-1 h-auto p-0 text-base"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )
      })}

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={isRowSelected(row.id) && "selected"}
                      className={isRowSelected(row.id) ? "bg-blue-100" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const rowId = cell.row.original._id ?? cell.row.getValue("id")
                        return (
                          <TableCell
                            key={cell.id}
                            onClick={() => toggleRow(rowId)}
                            className={`
                              ${cell.column.id === "select" || cell.column.id === "skuCode" || cell.column.id === "expander" ? "sticky left-0 z-10" : ""}
                              ${getColumnBackground(cell.column.id)}
                              ${selectedColumn === cell.column.id ? "bg-opacity-80 ring-1 ring-inset ring-primary" : ""}
                            `}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          <ExpandedRowContent row={row} dependentCols={dependentCols} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer / Pagination */}
      {showTools && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --------------- Column generator -----------------
interface GenerateColumnsProps {
  columnNames: string[]
  changeView: string[]
  dependentCols: string[]
  tableName: string
  hasCreatePermission: boolean
  onOpen: any
  updateSortInUrl: (index: number, isDesc: boolean | null, e: React.MouseEvent) => void
  searchParams: URLSearchParams
}

export const generateColumns = ({
  columnNames,
  dependentCols,
  changeView,
  tableName,
  hasCreatePermission,
  onOpen,
  updateSortInUrl,
  searchParams,
}: GenerateColumnsProps): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: true,
      enableHiding: false,
    },
  ]

  if (dependentCols.length > 0) {
    baseColumns.unshift({
      id: "expander",
      header: () => null,
      cell: ({ row }: any) => (
        <Button variant="ghost" onClick={() => row.toggleExpanded()} className="p-0 h-auto">
          {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    })
  }

  // const nameColumn = columnNames.includes("name")
  //   ? [
  //       {
  //         accessorKey: "name",
  //         header: "Name",
  //         cell: ({ row }: any) => {
  //           const value = row.getValue("name")
  //           return <span>{value}</span>
  //         },
  //         enableSorting: true,
  //         enableHiding: true,
  //         filterFn: multiSelectFilter,
  //       },
  //     ]
  //   : []

  const idColumn = columnNames.includes("_id") || columnNames.includes("id")
    ? [
        {
          accessorKey: "_id",
          header: "Id",
          cell: ({ row }: any) => {
            const value = row.getValue("_id")
            return hasCreatePermission ? (
              <span
                className="text-blue-900 cursor-pointer hover:underline"
                onClick={() =>
                  onOpen("childDetails:table", {
                    table: {
                      label: tableName,
                      data: row.original,
                      changeView: changeView.filter((x) => !(x.includes("_id") || x.includes("id"))),
                    },
                  })
                }
              >
                {value}
              </span>
            ) : (
              <span>{value}</span>
            )
          },
          enableSorting: true,
          enableHiding: true,
          filterFn: multiSelectFilter,
        },
      ]
    : []

  const dynamicColumns: ColumnDef<any>[] = columnNames
    .filter((colName) => !["_id", "id"].includes(colName))
    .map((colName) => ({
      accessorKey: colName,
      header: getSortableHeader(
        colName,
        capitalizeFirstLetter(colName),
        columnNames.indexOf(colName),
        updateSortInUrl,
        searchParams
      ),
      cell: ({ row }: any) => {
        const value = row.getValue(colName)
        if (colName === "createdAt") {
          return format(parseISO(value), "yyyy-MM-dd HH:mm:ss")
        }
        return (
          <div className="capitalize">
            {isValidUrl(value) ? (
              <Link href={value} target="_blank" className="my-1">
                <Image
                  src={value || "/placeholder.svg"}
                  alt={value}
                  height={250}
                  width={250}
                  className="rounded-sm h-24 w-24 object-cover"
                />
              </Link>
            ) : (
              <span>{value}</span>
            )}
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
      filterFn:
        colName === "createdAt"
          ? (row, columnId, filterValue: { start?: string; end?: string }) => {
              if (!filterValue?.start && !filterValue?.end) return true
              const date = parseISO(row.getValue(columnId))
              const start = filterValue.start ? parseISO(filterValue.start) : new Date(0)
              const end = filterValue.end ? parseISO(filterValue.end) : new Date(8640000000000000)
              return isWithinInterval(date, { start, end })
            }
          : multiSelectFilter,
    }))

  return [...baseColumns, ...idColumn, ...dynamicColumns]
}
