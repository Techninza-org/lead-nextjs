"use client"

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
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableFilters } from "./table-filters"
import { TablePagination } from "./table-pagination"
import { generateColumns } from "./columns"
import { ExpandedRowContent } from "./expanded-row"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ComponentType, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLead } from "@/components/providers/LeadProvider"
import { useDebounce } from "@/components/multi-select-shadcn-expension"
import { LoadMoreFiltersProps } from "./col-filter-list"
import { Button } from "@/components/ui/button"
import { leadMutation } from "@/lib/graphql/lead/mutation"
import { useAtomValue } from "jotai"
import { leads } from "@/lib/atom/leadAtom"
import { useModal } from "@/hooks/use-modal-store"
import { cn } from "@/lib/utils"

interface DataTableProps {
  filterOption?: Record<string, any[]>
  optOutFields: string[]
  leadProspectCols?: any[]
  data?: any[]
  changeView?: string[]
  columnNames?: string[]
  dependentCols?: string[]
  MoreInfo?: ComponentType<any>
  tableName: string
  showTools?: boolean
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onFilterChange?: (filters: Record<string, string[] | { start?: string; end?: string }>) => void
  onSortChange?: (sorting: SortingState) => void
}

export default function AdvanceDataTable({
  filterOption: defaultOption = {},
  optOutFields = [],
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
  onSortChange,
}: DataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { getLeadPagination, getTableFilterOptions } = useLead()
  const leadInfo: any = useAtomValue(leads)

  const [filterOption, setFilterOption] = useState<{ [key: string]: string[] }>({})
  const [isInitialFetchDone, setIsInitialFetchDone] = useState<Record<string, boolean>>({})

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState(() => searchParams.get("search") || "")
  const [activeFilters, setActiveFilters] = useState<Record<string, string[] | { start?: string; end?: string }>>({})
  const [searchValue, setSearchValue] = useState(() => searchParams.get("search") || "")
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({})
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState<number>(pagination.page || 1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [localData, setLocalData] = useState(data)
  const [isSelectAllClicked, setIsSelectAllClicked] = useState(false)

  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastApiCallRef = useRef<{ filters: string; page: number }>({ filters: "", page: 1 })
  const debouncedSearchValue = useDebounce(searchValue, 500)
  const currentApiType = searchParams.get("apiType");

  // Parse sort from URL on initial load
  useEffect(() => {
    const sortParam = searchParams.get("sort")
    if (sortParam) {
      try {
        const parsedSort = JSON.parse(decodeURIComponent(sortParam)) as SortingState
        setSorting(parsedSort)
      } catch (e) {
        console.error("Failed to parse sort parameter", e)
      }
    }
  }, [searchParams])

  const columns = useMemo(
    () => generateColumns({
      columnNames,
      dependentCols,
      tableName,
      changeView,
      hasCreatePermission: true,
      onOpen: () => { },
    }),
    [columnNames, dependentCols, tableName, changeView]
  )

  const table = useReactTable({
    data: localData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
    },
    onSortingChange: (updatedSorting) => {
      setSorting(updatedSorting)
      if (typeof updatedSorting === 'function') {
        const newSorting = updatedSorting(sorting)
        updateSortInUrl(newSorting)
        if (onSortChange) onSortChange(newSorting)
      } else {
        updateSortInUrl(updatedSorting)
        if (onSortChange) onSortChange(updatedSorting)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    manualPagination: true,
    pageCount: pagination.totalPages,
    getRowCanExpand: () => true,
  })

  const updateSortInUrl = useCallback((newSorting: SortingState) => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (newSorting.length > 0) {
        params.set("sort", encodeURIComponent(JSON.stringify(newSorting)))
      } else {
        params.delete("sort")
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)
  }, [searchParams, router, pathname])

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  const filterLocalData = useCallback((filters: Record<string, any>) => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === "search") {
          const searchStr = value as string
          if (!searchStr) return true
          return Object.values(item).some(val =>
            String(val)?.toLowerCase()?.includes(searchStr?.toLowerCase())
          )
        }
        if (key === "createdAt" && typeof value === "object") {
          const { start, end } = value as { start?: string; end?: string }
          const date = new Date(item.createdAt)
          return (!start || date >= new Date(start)) && (!end || date <= new Date(end))
        }
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(String(item[key]))
        }
        return true
      })
    })
  }, [data])

  const updateUrl = useCallback((filters: Record<string, any>, page: number) => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("table", tableName)
      params.set("page", page.toString())

      if (filters.search) {
        params.set("search", filters.search)
      } else {
        params.delete("search")
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (key === "search") return
        if (key === "createdAt" && typeof value === "object") {
          params.set(key, encodeURIComponent(JSON.stringify(value)))
        } else if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","))
        } else {
          params.delete(key)
        }
      })

      // Preserve sort parameter if it exists
      const sortParam = searchParams.get("sort")
      if (sortParam) {
        params.set("sort", sortParam)
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)
  }, [router, pathname, tableName, searchParams])

  const applyFilters = useCallback(async (filters: Record<string, any>, page: number) => {
    setIsLoading(true)

    const filteredData = filterLocalData(filters)

    if (filteredData.length > 0 && (Object.keys(activeFilters).length !== Object.keys(filters).length)) {
      setLocalData(filteredData)
      setIsLoading(false)
      return
    }

    const filtersString = JSON.stringify(filters)
    const lastCall = lastApiCallRef.current

    if (lastCall.filters === filtersString && lastCall.page === page) {
      setIsLoading(false)
      return
    }

    try {
      await getLeadPagination(page, pagination.limit, filters)
      lastApiCallRef.current = { filters: filtersString, page }
    } catch (error) {
      console.error('Error fetching filtered data:', error)
    }

    setIsLoading(false)
  }, [filterLocalData, getLeadPagination, pagination.limit])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    setGlobalFilter(value)

    const newFilters = { ...activeFilters }
    if (value) {
      newFilters.search = value
    } else {
      delete newFilters.search
    }
    updateUrl(newFilters, currentPage)
  }

  const handleFilterChange = useCallback((columnId: string, filterValue: string | { start?: string; end?: string }) => {
    const newFilters = { ...activeFilters }
    if (columnId === "createdAt") {
      newFilters[columnId] = filterValue as any
    } else {
      newFilters[columnId] = Array.isArray(newFilters[columnId])
        ? [...newFilters[columnId], filterValue as string]
        : [filterValue as string]
    }

    setActiveFilters(newFilters)
    updateUrl(newFilters, currentPage)
  }, [activeFilters, currentPage, updateUrl])

  const handleApplyFilters = () => {
    applyFilters(activeFilters, currentPage)
    if (onFilterChange) onFilterChange(activeFilters)
  }

  const handleLoadMoreFilters = useCallback(
    async ({ columnId, searchTerm, existingOptions, isInitialFetch = false }: LoadMoreFiltersProps) => {
      try {
        const newOptions = (await getTableFilterOptions(columnId, searchTerm)) || [];

        setFilterOption((prevOptions) => ({
          ...prevOptions,
          [columnId]: Array.from(new Set(newOptions)),
        }));

        if (isInitialFetch) {
          setIsInitialFetchDone((prev) => ({ ...prev, [columnId]: true }));
        }
      } catch (error) {
        console.error("Error loading more filters:", error);
      }
    },
    []
  );

  useEffect(() => {
    // Perform initial fetch for all columns
    const fetchInitialFilters = async () => {
      const columns = Array.from(new Set([...changeView]).values())
      for (const column of columns) {
        if (!isInitialFetchDone[column]) {
          await handleLoadMoreFilters({
            columnId: column,
            searchTerm: "",
            existingOptions: [],
            isInitialFetch: true,
          })
        }
      }
    }

    fetchInitialFilters()
  }, [handleLoadMoreFilters, isInitialFetchDone, changeView])

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    const parsedFilters: Record<string, any> = {}

    Object.entries(params).forEach(([key, value]) => {
      if (key === "page") {
        setCurrentPage(Number.parseInt(value) || 1)
      } else if (key === "search") {
        setGlobalFilter(value)
        setSearchValue(value)
      } else if (key === "sort") {
        try {
          const parsedSort = JSON.parse(decodeURIComponent(value)) as SortingState
          setSorting(parsedSort)
        } catch (e) {
          console.error("Failed to parse sort parameter", e)
        }
      } else if (key === "createdAt") {
        try {
          parsedFilters.createdAt = JSON.parse(decodeURIComponent(value))
        } catch (e) {
          console.error("Failed to parse date range", e)
        }
      } else if (value && key !== "table" && key !== "apiType") {
        parsedFilters[key] = value.split(",")
      }
    })

    if (Object.keys(parsedFilters).length > 0) {
      setActiveFilters(parsedFilters)
    }
  }, [searchParams])

  useEffect(() => {
    setLocalData(data)
  }, [data])

  useEffect(() => {
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (debouncedSearchValue === lastApiCallRef.current.filters) {
      return // Prevent duplicate API calls
    }

    const newFilters = { ...activeFilters }

    if (debouncedSearchValue) {
      newFilters.search = debouncedSearchValue
    } else {
      delete newFilters.search
    }

    lastApiCallRef.current.filters = debouncedSearchValue
    updateUrl(newFilters, currentPage)
    applyFilters(newFilters, currentPage)
  }, [debouncedSearchValue, activeFilters, currentPage, updateUrl, applyFilters])

  // Apply sorting when it changes
  useEffect(() => {
    if (sorting.length > 0) {
      applyFilters(activeFilters, currentPage)
    }
  }, [sorting, applyFilters, activeFilters, currentPage])

  const toggleApiType = (selectedRows: any[], paginationTotal: number) => {
    const key = `assign_bulk_${paginationTotal - selectedRows.length}`

    const isBulkModeActive = currentApiType?.includes(key);

    const newApiType = isBulkModeActive
      ? currentApiType?.replace(key, "").trim() || ""
      : `${currentApiType ? currentApiType + "," : ""}${key}`;

    const params = new URLSearchParams(searchParams.toString());
    if (newApiType) {
      params.set("apiType", newApiType);
      params.set("size", selectedRows.length.toString());
    } else {
      params.delete("apiType");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isBulkSelectAll = searchParams.get("apiType")?.includes("bulk")

  return (
    <div className="space-y-4">
      {showTools && (
        <TableFilters
          table={table}
          filterOption={filterOption}
          optOutFields={optOutFields}
          activeFilters={activeFilters}
          searchFilters={searchFilters}
          setSearchFilters={setSearchFilters}
          handleFilterChange={handleFilterChange}
          removeFilter={(columnId, filterValue) => {
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
            updateUrl(newFilters, currentPage)
          }}
          onClearAll={() => {
            setActiveFilters({})
            updateUrl({}, currentPage)
          }}
          searchValue={globalFilter}
          handleSearchChange={handleSearchChange}
          updateUrl={updateUrl}
          currentPage={currentPage}
          onFilterChange={onFilterChange}
          onApplyFilters={handleApplyFilters}
          onLoadMoreFilters={handleLoadMoreFilters}
        />
      )}

      <div className="flex justify-between">
        <div>
          <Button variant={'secondary'}> Rows/page: 50</Button>
          <Button variant={'secondary'}> Total Rows {pagination.total}</Button>
          {
            Boolean(selectedRows.length) && <Button variant={'secondary'}>
              <span className="mr-1">Total Selected Rows</span>
              {(isBulkSelectAll && selectedRows.length === 50) ? pagination.total : selectedRows.length}/{pagination.total}
            </Button>
          }
          {!((selectedRows.length !== 50) && !(selectedRows.length === leadInfo?.data.length)) && <Button
            onClick={() => toggleApiType(selectedRows, pagination.total)}
            variant={"default"}
            size={"sm"}
            className={cn("items-center gap-1", isBulkSelectAll && "bg-red-600")}
          >
            {isBulkSelectAll
              ? "Deselect All"
              : "Select All"}
          </Button>}
        </div>
        <div className="ml-auto flex gap-2">
          {MoreInfo && <MoreInfo selectedLeads={selectedRows} />}
        </div>
      </div>

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
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                </Fragment>
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

      <TablePagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => {
          setCurrentPage(page)
          if (onPageChange) onPageChange(page)
          updateUrl(activeFilters, page)
          applyFilters(activeFilters, page)
        }}
        isLoading={isLoading}
      />
    </div>
  )
}