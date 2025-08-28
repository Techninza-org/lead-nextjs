"use client"

import * as React from "react"
import {
  type ColumnDef,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { capitalizeFirstLetter, isValidUrl } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { format, isWithinInterval, parseISO } from "date-fns"
import { useModal } from "@/hooks/use-modal-store"

export const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue.length) return true
  const cellValue = row.getValue(columnId)
  return filterValue.includes(String(cellValue))
}

// Reusable sortable header factory reading our external sortParam
export const getSortableHeader = (
  columnId: string,
  label: string,
  index: number,
  sortParam: string,
  updateSortInUrl: (idx: number, desc: boolean|null, e: React.MouseEvent<HTMLButtonElement>) => void
) => {
  const SortableHeader: React.FC = () => {
    const sortArray = sortParam ? sortParam.split(",") : []
    const colIdx = index + 1
    const colSort = sortArray.find(s => Math.abs(parseInt(s)) === colIdx)
    const isDesc = colSort?.startsWith("-")
    const orderLabel = sortArray.findIndex(s => Math.abs(parseInt(s)) === colIdx)
      >= 0 ? `(${orderLabel+1})` : ""

    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="p-0 h-auto flex items-center gap-1"
          onClick={(e) => updateSortInUrl(index, colSort ? !isDesc : false, e)}
        >
          {label} {orderLabel}
          {colSort
            ? (isDesc ? <ArrowDown className="ml-1 h-4 w-4"/> : <ArrowUp className="ml-1 h-4 w-4"/>)
            : <ArrowUpDown className="ml-1 h-4 w-4 opacity-50"/>}
        </Button>
        {colSort && (
          <Button
            size="icon"
            variant="ghost"
            className="p-0 text-red-500"
            onClick={(e) => updateSortInUrl(index, null, e)}
          >
            <X className="h-4 w-4"/>
          </Button>
        )}
      </div>
    )
  }
  SortableHeader.displayName = `SortableHeader(${columnId})`
  return SortableHeader
}

interface AdvancedDataTableProps {
  filterOption?: Record<string, any>
  data: any[]
  changeView: string[]
  columnNames: string[]
  tableName: string
  dependentCols?: string[]
  MoreInfo?: React.FC<{ selectedLeads: any[] }>
  showTools?: boolean

  pagination?: { total: number; page: number; limit: number; totalPages: number }
  onPageChange?: (page: number) => void

  sortParam: string
  updateSortInUrl: (index: number, isDesc: boolean|null, e?: React.MouseEvent) => void
}

export default function AdvancedDataTable({
  filterOption = {},
  data,
  changeView,
  columnNames,
  tableName,
  dependentCols = [],
  MoreInfo,
  showTools = true,
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  onPageChange,
  sortParam,
  updateSortInUrl,
}: AdvancedDataTableProps) {
  const { onOpen } = useModal()

  // Build columns dynamically
  const columns: ColumnDef<any>[] = [
    // selection checkbox, expander, id, name, etc.
    // then dynamic:
    ...columnNames.map((col, i) => ({
      accessorKey: col,
      header: getSortableHeader(
        col,
        capitalizeFirstLetter(col),
        i,
        sortParam,
        updateSortInUrl
      ),
      cell: ({ row }) => {
        const val = row.getValue(col)
        if (col === "createdAt") return format(parseISO(val), "yyyy-MM-dd HH:mm:ss")
        return isValidUrl(val)
          ? <Link href={val} target="_blank"><Image src={val} alt="img" width={100} height={100}/></Link>
          : <span className="capitalize">{val}</span>
      },
      enableSorting: true,
      filterFn: multiSelectFilter,
    })),
  ]

  // Use React Table in manualPagination mode
  const table = useReactTable({
    data,
    columns,
    pageCount: pagination.totalPages,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // selection for MoreInfo
  const selectedRows = table.getRowModel().rows.filter(r => r.getIsSelected()).map(r => r.original)

  // pagination controls
  const currentPage = pagination.page
  const totalPages  = pagination.totalPages

  const renderPageItems = () => {
    const items = []
    for (let p = 1; p <= totalPages; p++) {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink
            isActive={p === currentPage}
            onClick={() => onPageChange?.(p)}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      )
    }
    return items
  }

  return (
    <div className="space-y-4">
      {showTools && MoreInfo && <MoreInfo selectedLeads={selectedRows}/>}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg =>
            <TableRow key={hg.id}>
              {hg.headers.map(h =>
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              )}
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {data.length === 0
            ? <TableRow><TableCell colSpan={columns.length} className="text-center">No data.</TableCell></TableRow>
            : table.getRowModel().rows.map(row =>
                <TableRow key={row.id} className={row.getIsSelected() ? "bg-blue-50" : ""}>
                  {row.getVisibleCells().map(cell =>
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  )}
                </TableRow>
              )
          }
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            />
          </PaginationItem>
            {renderPageItems()}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
