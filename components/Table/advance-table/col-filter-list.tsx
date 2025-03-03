"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface FilterInputProps {
  column: any
  searchFilters: Record<string, string>
  setSearchFilters: (filters: Record<string, string>) => void
  filterOption: Record<string, any[]>
  onLoadMoreFilters: (props: LoadMoreFiltersProps) => Promise<void>
  isLoading: boolean
  setIsLoading: (value: boolean) => void
}

export interface LoadMoreFiltersProps {
  columnId: string
  searchTerm: string
  existingOptions: string[]
  isInitialFetch?: boolean
}

export const FilterInput = ({
  column,
  searchFilters,
  setSearchFilters,
  filterOption,
  onLoadMoreFilters,
  isLoading,
  setIsLoading,
}: FilterInputProps) => {
  const [localSearch, setLocalSearch] = useState(searchFilters[column.id] ?? "")

  useEffect(() => {
    const fetchFilters = async (isInitialFetch = false) => {
      try {
        setIsLoading(true)
        await onLoadMoreFilters({
          columnId: column.id,
          searchTerm: localSearch,
          existingOptions: filterOption[column.id] || [],
          isInitialFetch,
        })
      } catch (error) {
        console.error("Error loading filters:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    if (!filterOption[column.id] || filterOption[column.id].length === 0) {
      fetchFilters(true)
    }

    const timeoutId = setTimeout(() => {
      setSearchFilters({
        ...searchFilters,
        [column.id]: localSearch,
      })

      if (localSearch) {
        fetchFilters()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [localSearch, column.id])

  return (
    <div className="relative">
      <Input
        placeholder={`Search ${column.id}...`}
        value={localSearch}
        onChange={(event) => setLocalSearch(event.target.value)}
        className="max-w-sm mb-2"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  )
}