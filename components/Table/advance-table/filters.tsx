import type { FilterFn } from "@tanstack/react-table"

export const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue.length) return true
  const cellValue = row.getValue(columnId)
  return filterValue.includes(String(cellValue))
}

export const createDebouncedSearch = (callback: (value: string) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout

  return (value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      callback(value)
    }, delay)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }
}