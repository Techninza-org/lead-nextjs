import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, X, ChevronDown } from "lucide-react"
import type { Table } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { FilterInput, type LoadMoreFiltersProps } from "./col-filter-list"

interface TableFiltersProps {
  table: Table<any>
  filterOption: Record<string, any[]>
  optOutFields: string[]
  activeFilters: Record<string, string[] | { start?: string; end?: string }>
  searchFilters: Record<string, string>
  setSearchFilters: (filters: Record<string, string>) => void
  handleFilterChange: (columnId: string, filterValue: string | { start?: string; end?: string }) => void
  removeFilter: (columnId: string, filterValue?: string) => void
  searchValue: string
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  updateUrl: (filters: Record<string, any>, page: number) => void
  currentPage: number
  onFilterChange?: (filters: Record<string, string[] | { start?: string; end?: string }>) => void
  onApplyFilters: () => void
  onClearAll: () => void
  onLoadMoreFilters: (props: LoadMoreFiltersProps) => Promise<void>
}

export const TableFilters = ({
  table,
  filterOption,
  optOutFields,
  activeFilters,
  searchFilters,
  setSearchFilters,
  handleFilterChange,
  removeFilter,
  searchValue,
  handleSearchChange,
  updateUrl,
  currentPage,
  onFilterChange,
  onApplyFilters,
  onClearAll,
  onLoadMoreFilters,
}: TableFiltersProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  return (
    <>
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
                    table.getAllColumns().forEach((column) => column.setFilterValue(""));
                    setOpenPopoverId(null); // Close any open popover
                    onClearAll();
                  }}
                >
                  clear all
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="grid gap-2">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanFilter())
                    .map((column) => {
                      if (optOutFields.includes(column.id)) return
                      const activeFilterCount = Array.isArray(activeFilters[column.id])
                        // @ts-ignore
                        ? activeFilters[column.id].length
                        : activeFilters[column.id] && typeof activeFilters[column.id] === "object"
                          ? 1
                          : 0

                      return (
                        <Popover
                          key={column.id}
                          open={openPopoverId === column.id}
                          onOpenChange={(open) => setOpenPopoverId(open ? column.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
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
                                    className="h-4 w-4 text-muted-foreground "
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeFilter(column.id)
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
                                        handleFilterChange(column.id, { ...currentFilter, start: startDate })
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
                                        const currentFilter = (column.getFilterValue() as { end?: string }) || {}
                                        handleFilterChange(column.id, { ...currentFilter, end: endDate })
                                      }}
                                      value={((column.getFilterValue() as { end?: string }) || {}).end || ""}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <FilterInput
                                    column={column}
                                    searchFilters={searchFilters}
                                    setSearchFilters={setSearchFilters}
                                    filterOption={filterOption}
                                    onLoadMoreFilters={onLoadMoreFilters}

                                    // Loading state....
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                  />
                                  <div className="max-h-[200px] overflow-auto">
                                    {Array.from(new Set(filterOption[column.id] || [])).length ? Array.from(new Set(filterOption[column.id] || [])).map((value: any) => (
                                      <div key={value} className="flex items-center space-x-2 py-1">
                                        <Checkbox
                                          checked={
                                            Array.isArray(activeFilters[column.id]) &&
                                            (activeFilters[column.id] as string[]).includes(value)
                                          }
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
                                    )) : isLoading ? <div className="text-center text-gray-500 mt-4">
                                      Loading...
                                    </div> : <div className="text-center text-gray-500 mt-4">
                                      🚫 No results found...
                                    </div>}
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
              <Button className="w-full" onClick={onApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {Object.entries(activeFilters).map(([columnId, filters]) => {
          if (columnId === "table") return null
          if (columnId === "createdAt" && typeof filters === "object") {
            const { start, end } = filters as { start?: string; end?: string }
            return (
              <Badge key={`${columnId}-date-range`} variant="secondary" className="mr-2">
                {`${columnId}: ${start ? format(parseISO(start), "yyyy-MM-dd HH:mm") : "Start"} to ${end ? format(parseISO(end), "yyyy-MM-dd HH:mm") : "End"
                  }`}
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
    </>
  )
}

