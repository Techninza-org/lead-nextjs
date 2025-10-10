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
import { Checkbox } from "@/components/ui/checkbox"


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
import { Button } from "@/components/ui/button"
import { useQuery } from "graphql-hooks"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignFormToRoot } from "@/components/admin/AssignFormToRoot"
import { ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { BackboneCopyToRoot } from "@/components/admin/BackboneCopyToRoot"

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
    const [downloadTrigger, setDownloadTrigger] = React.useState(false);

    function b64ToBlob(b64: string, mime: string) {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return new Blob([bytes], { type: mime });
    }

    

    


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

    const selectedRootIds = React.useMemo(
        () =>
            table
                .getSelectedRowModel()
                .rows
                .map((r) => (r.original as any).rootId)
                .filter(Boolean),
        [table.getSelectedRowModel().rows]

    )

    const { data: companiesData, refetch } = useQuery(adminQueries.GET_COMPANIES_DATA, {
        skip: !downloadTrigger, // Skip the query if downloadTrigger is false
        pause: true,
        variables: {
            selectedRootIds
        }
    });

    React.useEffect(() => {
        if (companiesData?.getCompaniesData) {

            const res = companiesData.getCompaniesData;
            if (res?.type === "file") {
                const blob = b64ToBlob(res.base64, res.mimeType);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = res.filename;
                a.click();
                URL.revokeObjectURL(url);
            }
        }
    }, [companiesData]);

    const singleSelected = selectedRootIds.length === 1 ? selectedRootIds[0] : null;
    const selectedRowsData = React.useMemo(
        () =>
            table
                .getSelectedRowModel()
                .rows
                .map((r) => r.original)
                .filter(Boolean),
        [table.getSelectedRowModel().rows]
    )
    const singleSelectedRowData = selectedRowsData.filter((row) => row.rootId === singleSelected)[0] || null;
    

    const rootInfoForAssign = singleSelected
      ? [{ id: singleSelectedRowData.id, name: singleSelectedRowData.name }]
      : [];

    const [searchQuery, setSearchQuery] = React.useState('')
    const [searchResults, setSearchResults] = React.useState<string[]>([])
    const {toast} = useToast();
    const [open, setOpen] = React.useState(false);
    const [open2, setOpen2] = React.useState(false);
    const [appliedFilters, setAppliedFilters] = React.useState<{
        categories: { id: string; name: string }[]
        tags: string[]
    }>({ categories: [], tags: [] })

    const debouncedQuery = useDebounce(searchQuery, 500)

    React.useEffect(() => {
        const fetchData = async () => {
            // if (!debouncedQuery) return


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

    const handleToggle = () => {
        if (selectedRootIds.length !== 1) {
            toast({
                title: "Select a single company to assign a form.",
                variant: "destructive",
              })
          return;
        }
        setOpen((prev) => !prev);
      };
    const handleToggle2 = () => {
        if (selectedRootIds.length !== 1) {
            toast({
                title: "Select a single company to assign a form.",
                variant: "destructive",
              })
          return;
        }
        setOpen2((prev) => !prev);
      };
    


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
                <Button
                    onClick={() => {
                        if (selectedRootIds.length === 0) {
                            return;
                        }
                        refetch({
                            ids: selectedRootIds,
                        });
                    }}
                    disabled={selectedRootIds.length === 0}
                >
                    Export Selected Companies
                </Button>
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
            <div className="w-full flex gap-4 pt-12 pb-12">
                <Card className="overflow-hidden w-full">
                    <div
                        className="flex justify-between items-center cursor-pointer px-6 py-4"
                        onClick={
                            handleToggle}
                    >
                        <div className="flex items-center gap-2">
                            <CardTitle className="m-0 font-bold text-lg">Assign Form</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown
                                className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                                size={20}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            maxHeight: open ? "2000px" : "0px",
                            transition: "max-height 0.25s ease",
                        }}
                        className="px-6 overflow-hidden"
                    >
                        {open && (
                            <div className="pt-2 pb-4">
                                <AssignFormToRoot selectedCompany={rootInfoForAssign} />
                            </div>
                        )}
                    </div>
                </Card>
                <Card className="overflow-hidden w-full">
                    <div
                        className="flex justify-between items-center cursor-pointer px-6 py-4"
                        onClick={handleToggle2}
                    >
                        <div className="flex items-center gap-2">
                            <CardTitle className="m-0 font-bold text-lg">Backbone</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown
                                className={`transition-transform duration-200 ${open2 ? "rotate-180" : "rotate-0"}`}
                                size={20}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            maxHeight: open2 ? "2000px" : "0px",
                            transition: "max-height 0.25s ease",
                        }}
                        className="px-6 overflow-hidden"
                    >
                        {open2 && (
                            <div className="pt-2 pb-4">
                                <BackboneCopyToRoot selectedCompany={rootInfoForAssign}  />
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
