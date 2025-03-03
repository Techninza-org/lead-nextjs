import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { format, isWithinInterval, parseISO } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { capitalizeFirstLetter, isValidUrl } from "@/lib/utils"
import { multiSelectFilter } from "./filters"
import { ViewLeadInfo } from "./view-lead-info"

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
    .filter((colName) => !["_id", "id", "name"].includes(colName))
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

  // ...idColumn, 
  return [...baseColumns, ...nameColumn, ...dynamicColumns]
}