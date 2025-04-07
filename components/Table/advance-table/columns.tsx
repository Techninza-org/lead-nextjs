import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { format, isWithinInterval, parseISO } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { capitalizeFirstLetter, isValidUrl } from "@/lib/utils"
import { multiSelectFilter } from "./filters"
import { ViewLeadInfo } from "./view-lead-info"
import { useLead } from "@/components/providers/LeadProvider"

interface GenerateColumnsProps {
  columnNames: string[]
  dependentCols: string[]
  changeView: string[]
  tableName: string
  hasCreatePermission: boolean
  onOpen: any
  getSortableHeader: any
}


export const GenerateColumns = ({
  columnNames,
  dependentCols,
  tableName,
  changeView,
  hasCreatePermission,
  onOpen,
  getSortableHeader
}: GenerateColumnsProps): ColumnDef<any>[] => {
  const { getChildData } = useLead()

  if(!columnNames || columnNames.length === 0) {
    console.error("No column names provided")
    return []
  }
  if(!tableName) {
    console.error("No table name provided")
    return []
  }

  const handleOpenModal = async (rowId: string) => {
    try {
      const childData = await getChildData(tableName, rowId)
      onOpen("enquiryDetails", {
        lead: {
          changeView,
          data: {
            ...childData,
            _id: rowId
          }
        }
      })
    } catch (error) {
      console.error("Error fetching child data:", error)
    }
  }

  // Base columns that are always included
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

  // Add expander column if needed
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

  // First column special handling - always apply ViewLeadInfo if hasCreatePermission
  const firstColumnName = columnNames?.[0];
  let firstColumn: ColumnDef<any>[] = [];
  
  // Skip if first column is id or _id
  if (firstColumnName !== "_id" && firstColumnName !== "id") {
    firstColumn = [{
      // Explicitly set the id to match the accessorKey
      id: firstColumnName,
      accessorKey: firstColumnName,
      header: getSortableHeader(firstColumnName, capitalizeFirstLetter(firstColumnName), 0),
      cell: ({ row }: any) => {
        const value = row.getValue(firstColumnName)
        // Always use ViewLeadInfo for first column if hasCreatePermission
        return hasCreatePermission ? (
          <ViewLeadInfo
            lead={row.original}
            changeView={changeView}
            tableName={tableName}
          />
        ) : (
          <span>{value}</span>
        )
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: firstColumnName === "createdAt"
        ? (row, columnId, filterValue: { start?: string; end?: string }) => {
          if (!filterValue?.start && !filterValue?.end) return true
          const date = parseISO(row.getValue(columnId))
          const start = filterValue.start ? parseISO(filterValue.start) : new Date(0)
          const end = filterValue.end ? parseISO(filterValue.end) : new Date(8640000000000000)
          return isWithinInterval(date, { start, end })
        }
        : multiSelectFilter,
    }];
  }

  // Rest of the columns (skip the first one and skip any id/_id columns)
  const restOfColumns: ColumnDef<any>[] = columnNames.slice(1)
    .filter(colName => colName !== "_id" && colName !== "id")
    .map((colName, index) => {
      // Standard column handling for all remaining columns
      return {
        // Explicitly set the id to match the accessorKey
        id: colName,
        accessorKey: colName,
        header: getSortableHeader(colName, capitalizeFirstLetter(colName), index + 1),
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
        filterFn: colName === "createdAt"
          ? (row, columnId, filterValue: { start?: string; end?: string }) => {
            if (!filterValue?.start && !filterValue?.end) return true
            const date = parseISO(row.getValue(columnId))
            const start = filterValue.start ? parseISO(filterValue.start) : new Date(0)
            const end = filterValue.end ? parseISO(filterValue.end) : new Date(8640000000000000)
            return isWithinInterval(date, { start, end })
          }
          : multiSelectFilter,
      }
    });

  // Combine all columns
  return [...baseColumns, ...firstColumn, ...restOfColumns]
}