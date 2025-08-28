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
import { GenerateColumns } from "./columns"
import { ExpandedRowContent } from "./expanded-row"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ComponentType, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLead } from "@/components/providers/LeadProvider"
import { useDebounce } from "@/components/multi-select-shadcn-expension"
import { LoadMoreFiltersProps } from "./col-filter-list"
import { Button } from "@/components/ui/button"
import { useAtomValue } from "jotai"
import { leads } from "@/lib/atom/leadAtom"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react"

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
  pagination = { total: 0, page: 1, limit: 5, totalPages: 0 },
  onPageChange,
  onFilterChange,
  onSortChange,
}: DataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { getLeadPagination, getTableFilterOptions } = useLead()
  const leadInfo = useAtomValue(leads)
  console.log("Lead Info:", leadInfo);
  

  // State management
  const [filterOption, setFilterOption] = useState<{ [key: string]: string[] }>({})
  const [isInitialFetchDone, setIsInitialFetchDone] = useState<Record<string, boolean>>({})
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
  const [sorting, setSorting] = useState<string>("")

  // Refs
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastApiCallRef = useRef<{ filters: string; page: number }>({ filters: "", page: 1 })

  // Derived state
  const debouncedSearchValue = useDebounce(searchValue, 500)
  const isBulkSelectAll = searchParams.get("apiType")?.includes("bulk")

  // Initialize sorting from URL
  useEffect(() => {
    const sortParam = searchParams.get("sort")
    if (sortParam) {
      setSorting(sortParam)
      if (onSortChange) onSortChange(sortParam)
    }
  }, [searchParams, onSortChange])

  const updateSortInUrl = useCallback((index: number, isDesc: boolean | null, event: React.MouseEvent) => {
    event.preventDefault();

    const currentSort = searchParams.get("sort") || "";
    let sortArray = currentSort ? currentSort.split(",") : [];

    const columnIndex = index + 1; // 1-based indexing
    const columnSort = sortArray.find(s => Math.abs(parseInt(s)) === columnIndex);

    if (isDesc === null) {
      // **REMOVE sorting when 'X' is clicked**
      sortArray = sortArray.filter(s => Math.abs(parseInt(s)) !== columnIndex);
    } else {
      // **TOGGLE sorting**
      if (columnSort) {
        // Update sorting direction
        sortArray = sortArray.map(s => {
          if (Math.abs(parseInt(s)) === columnIndex) {
            return isDesc ? `-${columnIndex}` : `${columnIndex}`;
          }
          return s;
        });
      } else {
        // Add new sorting column
        sortArray.push(isDesc ? `-${columnIndex}` : `${columnIndex}`);
      }
    }

    // Update URL with the new sort state
    const newSearchParams = new URLSearchParams(searchParams);
    if (sortArray.length > 0) {
      newSearchParams.set("sort", sortArray.join(","));
    } else {
      newSearchParams.delete("sort");
    }

    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);


  const getSortableHeader = useCallback((columnId: string, label: string, index: number) => {
    const SortableHeader = ({ column }: any) => {
      const currentSort = searchParams.get("sort") || ""
      const sortArray = currentSort.split(",")
      const columnSort = sortArray.find(s => Math.abs(parseInt(s)) === (index + 1))
      const isDesc = columnSort && columnSort.startsWith("-")

      // Find the order of this column in multi-column sorting
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
              isDesc ? (
                <ArrowDown className="ml-1 h-4 w-4" />
              ) : (
                <ArrowUp className="ml-1 h-4 w-4" />
              )
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
  }, [searchParams, updateSortInUrl])

  const columns = useMemo(
    () => GenerateColumns({
      columnNames: columnNames.filter((col) => col !== "_id" && col !== "id"),
      dependentCols,
      tableName,
      changeView,
      hasCreatePermission: true,
      onOpen: () => { },
      getSortableHeader,
    }),
    [columnNames, dependentCols, tableName, changeView, getSortableHeader]
  )

  // Initialize and configure table
  const table = useReactTable({
    data: localData,
    columns,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
    getRowCanExpand: () => true,
  })

  // Get selected rows data
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  // URL update utility
  const updateUrl = useCallback((filters: Record<string, any>, page: number) => {

    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("table", tableName)
      params.set("page", page.toString())

      // Handle search param
      if (filters.search) {
        params.set("search", filters.search)
      } else {
        params.delete("search")
      }

      // Handle all other filters
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

      // Preserve sort parameter
      const sortParam = searchParams.get("sort")
      if (sortParam) {
        params.set("sort", sortParam)
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)
  }, [router, pathname, tableName, searchParams])

  // Apply filters and fetch data
  const applyFilters = useCallback(async (filters: Record<string, any>, page: number) => {
    setIsLoading(true)

    const sortParam = searchParams.get("sort")
    const filtersString = JSON.stringify({ ...filters, sort: sortParam })
    const lastCall = lastApiCallRef.current

    // Avoid redundant API calls
    if (lastCall.filters === filtersString && lastCall.page === page) {
      setIsLoading(false)
      return
    }

    try {
      await getLeadPagination(page, pagination.limit, filters)
      lastApiCallRef.current = { filters: filtersString, page }
    } catch (error) {
      console.error('Error fetching filtered data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, pagination.limit, getLeadPagination])

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    setGlobalFilter(value)

    const newFilters = { ...activeFilters }
    if (value) {
      newFilters.search = value
    } else {
      delete newFilters.search
    }

    // Don't update URL immediately - let debounce handle it
  }, [activeFilters])

  // Handle individual filter change
  const handleFilterChange = useCallback((columnId: string, filterValue: string | { start?: string; end?: string }) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }

      if (columnId === "createdAt") {
        newFilters[columnId] = filterValue as any
      } else {
        newFilters[columnId] = Array.isArray(newFilters[columnId])
          ? [...newFilters[columnId], filterValue as string]
          : [filterValue as string]
      }

      updateUrl(newFilters, currentPage)
      return newFilters
    })
  }, [])

  // Apply filter changes 
  const handleApplyFilters = useCallback(async () => {
    applyFilters(activeFilters, currentPage)
    // if (onFilterChange) onFilterChange(activeFilters)
    await getLeadPagination(currentPage, 50, activeFilters)
    updateUrl(activeFilters, currentPage)
  }, [applyFilters, activeFilters, currentPage, getLeadPagination, updateUrl])

  // Handle loading more filter options
  const handleLoadMoreFilters = useCallback(
    async ({ columnId, searchTerm, existingOptions, isInitialFetch = false }: LoadMoreFiltersProps) => {
      try {
        const newOptions = (await getTableFilterOptions(columnId, searchTerm)) || [];

        setFilterOption(prevOptions => ({
          ...prevOptions,
          [columnId]: Array.from(new Set(newOptions)),
        }));

        if (isInitialFetch) {
          setIsInitialFetchDone(prev => ({ ...prev, [columnId]: true }));
        }
      } catch (error) {
        console.error("Error loading more filters:", error);
      }
    },
    [getTableFilterOptions]
  );

  // Toggle bulk selection
  const toggleApiType = useCallback((selectedRows: any[], paginationTotal: number) => {
    const key = `assign_bulk_${paginationTotal - selectedRows.length}`
    const currentApiType = searchParams.get("apiType") || ""
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
      params.delete("size");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Initial filter options fetch
  // useEffect(() => {
  //   const uniqueColumns = Array.from(new Set(changeView));
  //   const columnsToFetch = uniqueColumns.filter(column => !isInitialFetchDone[column]);

  //   if (columnsToFetch.length === 0) return;

  //   const fetchInitialFilters = async () => {
  //     for (const column of columnsToFetch) {
  //       await handleLoadMoreFilters({
  //         columnId: column,
  //         searchTerm: "",
  //         existingOptions: [],
  //         isInitialFetch: true,
  //       });
  //     }
  //   };

  //   fetchInitialFilters();
  // }, [isInitialFetchDone, changeView]);

  // Parse URL parameters into filters
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const parsedFilters: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (key === "page") {
        setCurrentPage(Number.parseInt(value) || 1);
      } else if (key === "search") {
        setGlobalFilter(value);
        setSearchValue(value);
        parsedFilters.search = value;
      } else if (key === "sort") {
        setSorting(value);
        if (onSortChange) onSortChange(value);
      } else if (key === "createdAt") {
        try {
          parsedFilters.createdAt = JSON.parse(decodeURIComponent(value));
        } catch (e) {
          console.error("Failed to parse date range", e);
        }
      } else if (value && key !== "table" && key !== "apiType" && key !== "size") {
        parsedFilters[key] = value.split(",");
      }
    });

    if (Object.keys(parsedFilters).length > 0) {
      setActiveFilters(parsedFilters);
    }
  }, [searchParams, onSortChange]);

  // Update local data when prop changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Handle debounced search
  useEffect(() => {
    if (!debouncedSearchValue && !searchValue) return;

    const newFilters = { ...activeFilters };

    if (debouncedSearchValue) {
      newFilters.search = debouncedSearchValue;
    } else {
      delete newFilters.search;
    }

    updateUrl(newFilters, currentPage);
    applyFilters(newFilters, currentPage);
  }, [debouncedSearchValue, activeFilters, currentPage, updateUrl, applyFilters, searchValue]);

  // Apply sorting when it changes
  useEffect(() => {
    if (sorting && sorting.length > 0) {
      applyFilters(activeFilters, currentPage);
    }
  }, [sorting, applyFilters, activeFilters, currentPage]);

  // Remove filter handler
  const handleRemoveFilter = useCallback((columnId: string, filterValue: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };

      if (columnId === "createdAt") {
        delete newFilters[columnId];
      } else if (Array.isArray(newFilters[columnId])) {
        newFilters[columnId] = newFilters[columnId].filter((value) => value !== filterValue);
        if (newFilters[columnId].length === 0) {
          delete newFilters[columnId];
        }
      }
      updateUrl(newFilters, currentPage)
      return newFilters;
    });
  }, [currentPage, updateUrl]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (onPageChange) onPageChange(page);
    updateUrl(activeFilters, page);
    applyFilters(activeFilters, page);
  }, [onPageChange, updateUrl, applyFilters, activeFilters]);

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
          removeFilter={handleRemoveFilter}
          onClearAll={() => {
            setActiveFilters({});
            router.push(`${pathname}?page=${currentPage}`, { scroll: false });
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
        <div className="flex gap-2">
          <Button variant="secondary">Rows/page: {pagination.limit}</Button>
          <Button variant="secondary">Total Rows: {pagination.total}</Button>
          {Boolean(selectedRows.length) && (
            <Button variant="secondary">
              <span className="mr-1">Selected:</span>
              {(isBulkSelectAll && table.getIsAllRowsSelected().valueOf())
                ? pagination.total
                : selectedRows.length}/{pagination.total}
            </Button>
          )}
          {(!((selectedRows.length !== 50) && !(selectedRows.length === leadInfo?.data?.length))) && (
            <Button
              onClick={() => toggleApiType(selectedRows, pagination.total)}
              variant={isBulkSelectAll ? "destructive" : "default"}
              size="sm"
              className="items-center gap-1"
            >
              {isBulkSelectAll ? "Deselect All" : "Select All"}
            </Button>
          )}
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
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  )
}