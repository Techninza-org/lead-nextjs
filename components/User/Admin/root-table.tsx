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
import { DataTableToolbar } from "@/components/ui/table-toolbar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarDaysIcon } from "lucide-react"
import { CategoryModal } from "./company/category-modal"
import { CategoryFilter } from "./company/category-filter"

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

    const handleSort = (value: string) => {
        if (value === 'Contacted') {
            const currentSorting = table.getState().sorting;
            const contactedSort = currentSorting.find(sort => sort.id === 'callStatus');

            const newSorting: SortingState = contactedSort
                ? [{ id: 'callStatus', desc: !contactedSort.desc }]
                : [{ id: 'callStatus', desc: false }];
            setSorting(newSorting);
        } else if (value === 'Follow Up Date') {
            const currentSorting = table.getState().sorting;
            const followUpDateSort = currentSorting.find(sort => sort.id === 'nextFollowUpDate');

            const newSorting: SortingState = followUpDateSort
                ? [{ id: 'nextFollowUpDate', desc: !followUpDateSort.desc }]
                : [{ id: 'nextFollowUpDate', desc: false }];
            setSorting(newSorting);
        } else {
            setSorting([]);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <CategoryFilter type="categories" items={categories.categories} />
                        <CategoryFilter type="subCategories" items={categories.subCategories} />
                        <CategoryFilter type="subCategories2" items={categories.subCategories2} />
                        <CategoryFilter type="subCategories3" items={categories.subCategories3} />
                        <CategoryFilter type="subCategories4" items={categories.subCategories4} />
                    </div>

                    {/* <DataTableToolbar table={table} setFilter={setFilter} /> */}
                </div>

                {/*
                <Select onValueChange={(value) => handleSort(value || 'Reset')}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="Company Name">Company Name</SelectItem>
                            <SelectItem value="Plan">Plan</SelectItem>
                            <SelectItem value="None">None</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select> */}
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
