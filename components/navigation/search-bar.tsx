"use client"

import type React from "react"

import { Search, User, Globe, Loader2, Phone, Mail } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { useMutation } from "graphql-hooks"
import { companyQueries } from "@/lib/graphql/company/queries"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { debounce } from "lodash"

interface SearchItem {
  _id: string
  _tableName: string
  _tableId: string
  _sourceTable: string
  createdAt?: string
  name?: string
  global_name?: string
  email?: string
  phone?: string
  [key: string]: any
}

interface BackendData {
  data: SearchItem[]
  pagination?: {
    page: number
    limit: number
    totalResults: number
    totalPages: number
  }
  tableBreakdown: Array<{
    tableName: string
    count: number
  }>
}

interface SearchBarProps {
  data: BackendData
}

export function SearchBar({ data }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<BackendData>(data)

  const router = useRouter()
  const params = useParams()

  const [globalSearch] = useMutation(companyQueries.Global_Search)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults(data)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const { data: response, error } = await globalSearch({
          variables: { searchTerm: term },
        })

        if (error) {
          console.error("Search error:", error)
          return
        }

        if (response?.globalSearchResolver) {
          setSearchResults(response.globalSearchResolver)
        }
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [globalSearch, data],
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => {
      document.removeEventListener("keydown", down)
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Update search results when data prop changes
  useEffect(() => {
    if (data) {
      setSearchResults(data)
    }
  }, [data])

  const getIcon = (tableName: string) => {
    switch (tableName) {
      case "Lead":
        return <User className="w-4 h-4" />
      case "Global search test":
        return <Globe className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch {
      return dateString
    }
  }

  // Group results by tableName
  const groupedResults = searchResults?.data
    ? Object.groupBy(searchResults.data, (item) => item._tableName || "Unknown")
    : {}

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group border-none px-2 py-2 max-w-sm rounded-full bg-zinc-200 flex items-center gap-x-2 w-full hover:bg-zinc-200/95 transition"
      >
        <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-800 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition">
          Search ({searchResults?.pagination?.totalResults || 0} results)
        </p>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Search across all tables..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="mb-4"
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>Searching...</p>
              </div>
            ) : !searchResults?.data || searchResults.data.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">No results found</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([tableName, items]) => (
                  <div key={tableName} className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      {tableName} ({(items as SearchItem[]).length})
                    </h3>
                    <div className="space-y-2">
                      {(items as SearchItem[]).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setOpen(false)
                            // Add navigation logic here if needed
                          }}
                        >
                          {getIcon(item._tableName)}
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name || item.global_name || "Unnamed Item"}</span>
                            <div className="flex gap-2">
                              {item.email && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" /> {item.email}
                                </span>
                              )}
                              {item.phone && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" /> {item.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-auto">
                            {item.createdAt && <Badge variant="secondary">{formatDate(item.createdAt)}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

