"use client"
import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/table-pagination"
import OptimizedFilterDropdown from "./company/category-filter"
import { useDebounce } from "@/components/multi-select-shadcn-expension"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

type DateRange = {
    from: Date
    to: Date
}

type AppliedFilters = {
    tags: string[]
}

export function CompaniesFunctionsDataTable<
    TData extends {
        functionName: string
        desc: string
        viewName: string
        tags?: string[]
        isValid: boolean
        createdAt: string
    },
    TValue
>({ columns, data }: DataTableProps<TData, TValue>) {
    const functionNames = React.useMemo(
        () => Array.from(new Set(data.map(row => row.functionName))).filter(Boolean),
        [data]
      );
      
      const viewNames = React.useMemo(
        () => Array.from(new Set(data.map(row => row.viewName))).filter(Boolean),
        [data]
      );
      
      const isValidOptions = [
        { value: "", label: "All" },
        { value: "true", label: "True" },
        { value: "false", label: "False" },
      ];
      
    // State management
    const [searchQuery, setSearchQuery] = React.useState<string>("")
    const [filteredData, setFilteredData] = React.useState<TData[]>(data)
    const [appliedFilters, setAppliedFilters] = React.useState<AppliedFilters>({
        tags: [],
    })
    
    const defaultToDate = new Date()
    const defaultFromDate = new Date()
    defaultFromDate.setDate(defaultToDate.getDate() - 10)
    
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: defaultFromDate,
        to: defaultToDate,
    })
    
    const debouncedQuery = useDebounce(searchQuery, 500)

    // Table state
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState<string>("")

    // Combined filter effect
    React.useEffect(() => {
        let filtered = [...data]
        
        // 1. Apply date filter if date range is set
        if (dateRange?.from && dateRange?.to) {
            const fromUTC = Date.UTC(
                dateRange.from.getFullYear(), 
                dateRange.from.getMonth(), 
                dateRange.from.getDate(), 
                0, 0, 0, 0
            )
            const toUTC = Date.UTC(
                dateRange.to.getFullYear(), 
                dateRange.to.getMonth(), 
                dateRange.to.getDate(), 
                23, 59, 59, 999
            )
            
            filtered = filtered.filter((row) => {
                const createdAtTimestamp = new Date(row.createdAt).getTime()
                return createdAtTimestamp >= fromUTC && createdAtTimestamp <= toUTC
            })
        }
        
        // 2. Apply global search filter
        if (debouncedQuery) {
            const query = debouncedQuery.toLowerCase()
            filtered = filtered.filter((row) => 
                row.functionName.toLowerCase().includes(query) || 
                row.desc.toLowerCase().includes(query) ||
                row.viewName.toLowerCase().includes(query)
            )
        }
        
        // 3. Apply tag filter if tags are selected
        if (appliedFilters.tags.length > 0) {
            filtered = filtered.filter((row) => 
                row.tags?.some(tag => appliedFilters.tags.includes(tag))
            )
        }
        
        // Update column filters for the table
        setColumnFilters([
            ...(appliedFilters.tags.length
                ? [{ id: "tags", value: appliedFilters.tags }]
                : []),
        ])
        
        // Update global filter for the table
        setGlobalFilter(debouncedQuery)
        
        // Set the final filtered data
        setFilteredData(filtered)
    }, [data, dateRange, debouncedQuery, appliedFilters.tags])

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            columnFilters,
            sorting,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <OptimizedFilterDropdown
                    initialData={data}
                    onSearch={setSearchQuery}
                    onApplyFilters={setAppliedFilters}
                    onDateChange={setDateRange}
                    dateRange={dateRange}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() ? "selected" : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
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

            <DataTablePagination table={table} />
        </div>
    )
}