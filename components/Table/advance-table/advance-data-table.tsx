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
import { ChevronDown, Search, X, ChevronRight, Calendar, ChevronLeftSquareIcon, ChevronRightSquareIcon, ChevronRightIcon, ChevronLeft, ChevronRightSquare } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { capitalizeFirstLetter, isValidUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { usePermissions } from "../../providers/PermissionContext"
import { useModal } from "@/hooks/use-modal-store"
import type { leadSchema } from "@/types/lead"
import type { z } from "zod"
import { format, isWithinInterval, parseISO } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { useLead } from "../../providers/LeadProvider"
import { leadMutation } from "@/lib/graphql/lead/mutation"

export const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue.length) return true
  const cellValue = row.getValue(columnId)
  return filterValue.includes(String(cellValue))
}

// const DraggableTableHeader = ({ header, table }) => {
//   const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
//     id: header.id,
//   })

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//   }

//   return (
//     <TableHead
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       className={`
//         cursor-move
//         ${header.column.id === "select" || header.column.id === "skuCode" || header.column.id === "expander" ? "sticky left-0 z-10" : ""}
//         `}
//     >
//       <div className="flex items-center">
//         <GripVertical className="mr-2 h-4 w-4" {...listeners} />
//         {flexRender(header.column.columnDef.header, header.getContext())}
//       </div>
//     </TableHead>
//   )
// }

const createDebouncedSearch = (callback: (value: string) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;

  return (value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(value);
    }, delay);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  };
};


export default function AdvancedDataTable({
  filterOption = {},
  leadProspectCols = [],
  data = [],
  changeView = [],
  columnNames = [],
  dependentCols = [],
  MoreInfo,
  tableName,
  showTools = true,
  pagination = { total: 0, page: 1, limit: 50, totalPages: 0 },
  onPageChange,
  onFilterChange,
}: {
  filterOption: any
  data: any[]
  changeView: string[]
  columnNames: string[]
  tableName: string
  dependentCols?: string[]
  leadProspectCols?: any[]
  MoreInfo?: any
  showTools?: boolean
  pagination?: { total: number; page: number; limit: number; totalPages: number }
  onPageChange?: (page: number) => void
  onFilterChange?: (filters: Record<string, string[] | { start?: string; end?: string }>) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedColumn, setSelectedColumn] = React.useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState(() => {
    // Initialize from URL params
    return searchParams.get("search") || ""
  }); const [activeFilters, setActiveFilters] = React.useState<Record<string, string[] | { start?: string; end?: string }>>({})
  const [searchValue, setSearchValue] = React.useState(() => searchParams.get("search") || "");

  const [searchFilters, setSearchFilters] = React.useState<Record<string, string>>({})
  const [columnOrder, setColumnOrder] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState<number>(pagination.page || 1)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const { checkPermission } = usePermissions()
  const { onOpen } = useModal()
  const { getLeadPagination } = useLead()

  // // Initialize filters from URL on component mount
  // React.useEffect(() => {
  //   const params = Object.fromEntries(searchParams.entries());
  //   const parsedFilters: Record<string, any> = {};

  //   // Parse filters from URL
  //   Object.entries(params).forEach(([key, value]) => {
  //     if (key === "page") {
  //       setCurrentPage(Number.parseInt(value) || 1);
  //     } else if (key === "search") {
  //       setGlobalFilter(value);
  //     } else if (key === "createdAt") {
  //       try {
  //         const dateRange = JSON.parse(decodeURIComponent(value));
  //         parsedFilters.createdAt = dateRange;
  //       } catch (e) {
  //         console.error("Failed to parse date range", e);
  //       }
  //     } else if (value) {
  //       parsedFilters[key] = value.split(",");
  //     }
  //   });

  //   if (Object.keys(parsedFilters).length > 0) {
  //     setActiveFilters(parsedFilters);
  //   }
  // }, [searchParams]);

  const columns: ColumnDef<any>[] = generateColumns({
    columnNames,
    dependentCols,
    tableName,
    changeView,
    hasCreatePermission: checkPermission(`CREATE:${tableName?.toUpperCase()}`),
    onOpen,
  })

  const table = useReactTable({
    data,
    columns,
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
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    filterFns: {
      multiSelect: multiSelectFilter,
    },
    getRowCanExpand: () => true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  })

  React.useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((d) => d.id))
    }
  }, [table.getAllLeafColumns, columnOrder.length])

  // Update pagination in the table when it changes from props
  React.useEffect(() => {
    if (table.getState().pagination.pageSize !== pagination.limit) {
      table.setPageSize(pagination.limit)
    }
    if (table.getState().pagination.pageIndex !== pagination.page - 1) {
      table.setPageIndex(pagination.page - 1)
    }
  }, [pagination.limit, pagination.page, table.setPageSize, table.setPageIndex])

  const handleSearch = React.useCallback((value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters.search = value;
    } else {
      delete newFilters.search;
    }

    // Update URL and filters
    updateUrl(newFilters, currentPage);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
    getLeadPagination(newFilters, currentPage, 50);
  }, [activeFilters, currentPage, onFilterChange, getLeadPagination]);


  const debouncedSearch = React.useMemo(
    () => createDebouncedSearch(handleSearch, 500),
    [handleSearch]
  );

  const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    setGlobalFilter(value);
    debouncedSearch(value);
  }, [debouncedSearch]);


  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  React.useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl !== searchValue) {
      setSearchValue(searchFromUrl || "");
      setGlobalFilter(searchFromUrl || "");
    }
  }, [searchParams]);



  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

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

  const updateUrl = (filters: Record<string, any>, page: number) => {
    const params = new URLSearchParams();

    // Add page parameter
    params.set("table", tableName);
    params.set("page", page.toString());

    // Add global search if present
    if (filters.search) {
      params.set("search", filters.search);
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "search") return; // Skip search as it's already handled
      if (key === "createdAt" && typeof value === "object") {
        params.set(key, encodeURIComponent(JSON.stringify(value)));
      } else if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","));
      }
    });

    // Update URL without refreshing the page
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (columnId: string, filterValue: string | { start?: string; end?: string }) => {
    const newFilters = { ...activeFilters };

    if (columnId === "createdAt") {
      newFilters[columnId] = filterValue as any;
    } else {
      newFilters[columnId] = Array.isArray(newFilters[columnId])
        ? [...newFilters[columnId], filterValue as string]
        : [filterValue as string];
    }

    setActiveFilters(newFilters);

    const column = table.getColumn(columnId);
    if (column) {
      if (columnId === "createdAt") {
        column.setFilterValue(filterValue);
      } else {
        const currentFilterValue = column.getFilterValue() as string[];
        column.setFilterValue([...(currentFilterValue || []), filterValue]);
      }
    }

    updateUrl(newFilters, currentPage);
  };

  React.useEffect(() => {
    getLeadPagination(activeFilters, currentPage, 50);
  }, [searchParams.toString(), currentPage]);

  const removeFilter = (columnId: string, filterValue?: string) => {
    const newFilters = { ...activeFilters }

    if (columnId === "createdAt") {
      delete newFilters[columnId]
    } else if (Array.isArray(newFilters[columnId])) {
      newFilters[columnId] = newFilters[columnId].filter((value) => value !== filterValue)
      if (newFilters[columnId].length === 0) {
        delete newFilters[columnId]
      }
    }

    setActiveFilters(newFilters)

    const column = table.getColumn(columnId)
    if (column) {
      if (columnId === "createdAt") {
        column.setFilterValue(undefined)
      } else {
        const currentFilterValue = column.getFilterValue() as string[]
        column.setFilterValue(currentFilterValue?.filter((value) => value !== filterValue) || [])
      }
    }

    // // Update URL and call onFilterChange callback
    updateUrl(newFilters, currentPage)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }

    // Simulate data fetching
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (onPageChange) {
      onPageChange(page)
    }
    updateUrl(activeFilters, page)

    // // Simulate data fetching
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
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

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5
    const halfVisible = Math.floor(maxVisiblePages / 2)

    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Add first page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      items.push(
        <PaginationItem key={pagination.totalPages}>
          <PaginationLink onClick={() => handlePageChange(pagination.totalPages)}>
            {pagination.totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  React.useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const parsedFilters: Record<string, any> = {};

    // Parse filters from URL
    Object.entries(params).forEach(([key, value]) => {
      if (key === "page") {
        setCurrentPage(Number.parseInt(value) || 1);
      } else if (key === "search") {
        setGlobalFilter(value);
      } else if (key === "createdAt") {
        try {
          const dateRange = JSON.parse(decodeURIComponent(value));
          parsedFilters.createdAt = dateRange;
        } catch (e) {
          console.error("Failed to parse date range", e);
        }
      } else if (value) {
        parsedFilters[key] = value.split(",");
      }
    });

    if (Object.keys(parsedFilters).length > 0) {
      setActiveFilters(parsedFilters);
    }
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showTools && (
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filter all columns..."
              value={searchValue}
              onChange={handleSearchChange}
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
                        updateUrl({}, currentPage)
                        if (onFilterChange) {
                          onFilterChange({})
                        }
                        // Simulate data fetching
                        setIsLoading(true)
                        setTimeout(() => {
                          setIsLoading(false)
                        }, 1000)
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
                            ? Array.isArray(activeFilters[column.id]) ? activeFilters[column.id].length : 0
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
                                          const newFilters = { ...activeFilters }
                                          delete newFilters[column.id]
                                          setActiveFilters(newFilters)
                                          column.setFilterValue("")
                                          updateUrl(newFilters, currentPage)
                                          if (onFilterChange) {
                                            onFilterChange(newFilters)
                                          }
                                          // Simulate data fetching
                                          setIsLoading(true)
                                          setTimeout(() => {
                                            setIsLoading(false)
                                          }, 1000)
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
                                            const currentFilter =
                                              (column.getFilterValue() as { start?: string; end?: string }) || {}
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
                                            const currentFilter =
                                              (column.getFilterValue() as { start?: string; end?: string }) || {}
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
                                        {Array.from(new Set(filterOption[column.id] || [])).map((value: any) => (
                                          <div key={value} className="flex items-center space-x-2 py-1">
                                            <Checkbox
                                              checked={Array.isArray(activeFilters[column.id]) && (activeFilters[column.id] as string[]).includes(value)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  handleFilterChange(column.id, value)
                                                } else {
                                                  removeFilter(column.id, value)
                                                }
                                              }}
                                              id={`${column.id}-${value}`}
                                            />
                                            <Label htmlFor={`${column.id}-${value}`} className="text-sm cursor-pointer">
                                              {value}
                                            </Label>
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
            {tableName === "Lead" && selectedRows.length === 50 && <Button
              onClick={() => onOpen("bulk:operation", { apiUrl: leadMutation.LEAD_ASSIGN_TO, query: "Lead" })}
              variant={'default'}
              size={"sm"}
              className="items-center gap-1"
            >
              Select All
            </Button>}
          </div>
        )}
        {MoreInfo && <MoreInfo selectedLeads={selectedRows} />}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {Object.entries(activeFilters).map(([columnId, filters]) => {
          if (columnId === "table") return
          if (columnId === "createdAt" && typeof filters === "object") {
            const { start, end } = filters as { start?: string; end?: string }
            return (
              <Badge key={`${columnId}-date-range`} variant="secondary" className="mr-2">
                {`${columnId}: ${start ? format(parseISO(start), "yyyy-MM-dd HH:mm") : "Start"} to ${end ? format(parseISO(end), "yyyy-MM-dd HH:mm") : "End"}`}
                <Button variant="ghost" onClick={() => removeFilter(columnId)} className="ml-1 h-auto p-0 text-base">
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          }
          return (
            Array.isArray(filters) &&
            filters.map((filter) => (
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
      </div>

      {/* Table component with loading state */}
      <div className="rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={getColumnBackground(header.id)}>
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
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={getColumnBackground(cell.column.id)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && dependentCols.length > 0 && (
                    <tr>
                      <td colSpan={row.getVisibleCells().length}>
                        <ExpandedRowContent row={row} dependentCols={dependentCols} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading..." : "No results found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between space-x-6 lg:space-x-8">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {pagination.totalPages}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === pagination.totalPages || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>


      </div>
    </div>
  )
}



const ViewLeadInfo = ({ lead, changeView }: { changeView: any, lead: z.infer<typeof leadSchema> }) => {
  const { onOpen } = useModal()

  return (
    <div className="flex items-center">
      <span className="text-blue-900 cursor-pointer hover:underline" onClick={() => onOpen("viewLeadInfo", { lead, table: { changeView } })}>
        {lead.name}
      </span>
    </div>
  )
}

interface GenerateColumnsProps {
  columnNames: string[]
  dependentCols: string[]
  changeView: string[]
  tableName: string
  hasCreatePermission: boolean
  onOpen: any
}

export const generateColumns = ({
  columnNames,
  dependentCols,
  tableName,
  changeView,
  hasCreatePermission,
  onOpen,
}: GenerateColumnsProps): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]

  // Only add expander column if there are dependent columns
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

  const nameColumn =
    tableName?.toLowerCase() === "lead" && columnNames.includes("name")
      ? [
        {
          accessorKey: "name",
          header: "Name",
          cell: ({ row }: any) => {
            const value = row.getValue("name")
            return hasCreatePermission ? <ViewLeadInfo lead={row.original} changeView={changeView} /> : <span>{value}</span>
          },
          enableSorting: true,
          enableHiding: true,
          filterFn: multiSelectFilter,
        },
      ]
      : []

  const idColumn = columnNames.includes("_id")
    ? [
      {
        accessorKey: "_id",
        header: "Id",
        cell: ({ row }: any) => {
          const value = row.getValue("_id")
          return hasCreatePermission ? (
            <span
              className="text-blue-900 cursor-pointer hover:underline"
              onClick={() => onOpen("enquiryDetails", { lead: { changeView, data: row.original } })}
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
    .filter((colName) => !["_id", "name"].includes(colName))
    .map((colName) => ({
      accessorKey: colName,
      header: capitalizeFirstLetter(colName),
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

  return [...baseColumns, ...idColumn, ...nameColumn, ...dynamicColumns]
}