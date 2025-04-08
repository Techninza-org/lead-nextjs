"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
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
import FilterDropdown from "./company/category-filter"
import { useCompany } from "@/components/providers/CompanyProvider"
import { useDebounce } from "@/components/multi-select-shadcn-expension"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    categories: any
}

export function RootTable<TData, TValue>({
    columns,
    data,
    categories
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [sorting, setSorting] = React.useState<SortingState>([])

    // Custom global filter
    const [filter, setFilter] = React.useState<string>("")

    const [monthData, setMonthData] = React.useState<any[]>([]);

    const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);

    const { getRootPagination } = useCompany()

    const handleDayClick = (date: Date) => {
        setSelectedMonth(date);
        const monthStartDate = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        const monthEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
        const filteredData = data.filter((lead: any) => {
            return lead.createdAt >= monthStartDate && lead.createdAt <= monthEndDate;
        })
        setMonthData(filteredData);
    };

    const table = useReactTable({
        data: selectedMonth ? monthData : data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            globalFilter: filter,  // Custom global filter
        },
        onGlobalFilterChange: setFilter,  // Custom global filter
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const [searchQuery, setSearchQuery] = React.useState('')
    const [searchResults, setSearchResults] = React.useState<string[]>([])
    const [appliedFilters, setAppliedFilters] = React.useState<{
        categories: { id: string; name: string }[]
        tags: string[]
    }>({ categories: [], tags: [] })

    const debouncedQuery = useDebounce(searchQuery, 500)

    React.useEffect(() => {
        const fetchData = async () => {
            // if (!debouncedQuery) return

            console.log('Fetching API for:', debouncedQuery)

            await getRootPagination(1, { ...appliedFilters, query: debouncedQuery })

            // Mock local filter (if categories object available)
            const tagMatches = (categories?.tags || []).filter(tag =>
                tag.toLowerCase().includes(debouncedQuery.toLowerCase())
            )

            const catMatches = (categories?.categories || [])
                .map(cat => cat.name)
                .filter(name => name.toLowerCase().includes(debouncedQuery.toLowerCase()))

            const results = [...tagMatches, ...catMatches]

            setSearchResults(results)
        }

        fetchData()
    }, [debouncedQuery, appliedFilters])

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <FilterDropdown
                            initialData={categories || {}}
                            onSearch={(query) => setSearchQuery(query)}
                            onApplyFilters={setAppliedFilters} //
                        />
                    </div>
                    {/* <DataTableToolbar table={table} setFilter={setFilter} /> */}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
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
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
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
