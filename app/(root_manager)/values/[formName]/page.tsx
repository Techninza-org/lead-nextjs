"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

import AdvancedDataTableForms from "@/components/advance-data-table-forms"
import { useCompany } from "@/components/providers/CompanyProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useModal } from "@/hooks/use-modal-store"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { companyQueries } from "@/lib/graphql/company/queries"
import { companyMutation } from "@/lib/graphql/company/mutation"
import { leadMutation } from "@/lib/graphql/lead/mutation"
import { deptQueries } from "@/lib/graphql/dept/queries"
import { useMutation, useQuery } from "graphql-hooks"
import { useToast } from "@/components/ui/use-toast"
import { CheckIcon, ChevronsUpDownIcon, PlusCircleIcon, UploadIcon } from "lucide-react"
import { cn, updateDependentFields } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePermissions } from "@/components/providers/PermissionContext"

export default function Page({ params }: { params: { formName: string } }) {
  const [unselectedRows, setUnselectedRows] = useState<string[]>([])
  const formName = decodeURIComponent(params?.formName)
  const { onOpen } = useModal()
  const { companyDeptFields } = useCompany()
  const { toast } = useToast()
  const { checkPermission } = usePermissions()

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Initialize sortParam from URL on mount (before query runs)
  const initialSortFromUrl = searchParams.get("sort") || ""
  const [sortParam, setSortParam] = useState<string>(initialSortFromUrl)
  const defaultSortSetRef = useRef(false) // Track if default sort has been set
  // pagination
  const [page, setPage] = useState<number>(1)
  const limit = 10
  // filters
  const [filters, setFilters] = useState<Record<string, any>>({})
  // search results for hybrid filtering
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  

  const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE)

  // Memoize variables to prevent infinite refetch
  const queryVariables = useMemo(() => {
    return {
      formName,
      filters,
      page,
      limit,
      // If sortParam is empty, pass empty string - backend will default to _id: -1 (newest first)
      // If sortParam has a value, use it (it should be the correct index for createdAt or _id)
      sort: sortParam || "",
    };
  }, [formName, filters, page, limit, sortParam])

  // Create a unique key for the query to force refetch when page changes
  const queryKey = `${formName}-${page}-${JSON.stringify(filters)}-${sortParam}`

  

  // Only log once when component mounts
  useEffect(() => {
  }, []);
  
  const { data, loading, error, refetch } = useQuery(
    companyQueries.GET_SUBMITTED_FORM_VALUE,
    {
      variables: queryVariables,
      skip: !formName,
      refetchAfterMutations: [companyMutation.FUNCTION_EXCUTE, leadMutation.SUBMIT_LEAD],
    }
  )

  // Fetch first 50 rows for filtering (independent of pagination)
  const { data: filterData, loading: filterDataLoading, error: filterDataError } = useQuery(
    companyQueries.GET_SUBMITTED_FORM_VALUE,
    {
      variables: {
        formName,
        filters: {},
        page: 1,
        limit: 50, // Always fetch 50 rows for filtering
        sort: "",
      },
      skip: !formName,
    }
  )


  // Search query for database-wide search
  const { refetch: searchFormValueRefetch } = useQuery(companyQueries.SEARCH_FORM_VALUE, {
    skip: true // Skip by default, we'll trigger it manually
  })


  // Handle page changes from child component
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // The query will automatically refetch when the page state changes
    // because page is in the variables object
  }

  // Handle filter changes from child component with hybrid filtering
  const handleFiltersChange = async (newFilters: Record<string, any>) => {
    // Get the 50 rows data for filtering
    const filterDataRows = filterData?.getFormValuesByFormName?.data || [];
    
    // For now, let's just implement the basic filtering without the complex hybrid logic
    // We'll set the filters and let the normal flow handle it
    setFilters(newFilters);
    setPage(1);
    
    // TODO: Implement the hybrid filtering logic step by step
  }

  // our payload now comes back as
  // { data, pagination, listView, changeView }
  const formData = data?.getFormValuesByFormName || {}
  
  // For now, just use normal data (we'll implement search mode later)
  const displayData = formData.data || [];
  const displayPagination = formData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  
  // Initialize sort param from URL on mount, or set default to createdAt descending
  useEffect(() => {
    const urlSort = searchParams.get("sort")
    
    // If URL has sort and it's different from current, update it
    if (urlSort && urlSort !== sortParam) {
      setSortParam(urlSort)
      defaultSortSetRef.current = true // Mark that sort is set from URL
      return
    }
    
    // If no sort in URL and default hasn't been set yet, set default to createdAt descending
    if (!urlSort && formData?.listView && !defaultSortSetRef.current) {
      const listView = formData.listView || []
      
      console.log('Checking for createdAt in listView. Available columns:', listView)
      
      // Try to find createdAt in listView (preferred for sorting)
      // Check for various possible formats: createdAt, createdAt, CreatedAt, etc.
      const createdAtIndex = listView.findIndex((col: string) => {
        const normalized = col.toLowerCase().trim()
        return normalized === "createdat" || normalized === "created_at" || normalized === "created at"
      })
      
      console.log('createdAt index found:', createdAtIndex)
      
      if (createdAtIndex >= 0) {
        // createdAt found in listView, sort by it in descending order
        // Backend uses 1-based indexing: absIndex - 1 to get field from listView
        // So if createdAt is at index 0 in listView, we use sort value "1" (which becomes absIndex=1, then listView[1-1]=listView[0])
        // For descending, we use negative: "-1"
        const sortValue = `-${createdAtIndex + 1}` // +1 because backend uses 1-based indexing
        console.log(`Setting default sort: createdAt found at index ${createdAtIndex} in listView, using sort value: ${sortValue}`)
        console.log(`listView columns:`, listView)
        console.log(`Column at index ${createdAtIndex}:`, listView[createdAtIndex])
        defaultSortSetRef.current = true // Mark that default sort has been set
        // Update URL first, then set sortParam (this will trigger query refetch)
        const newSearchParams = new URLSearchParams(searchParams.toString())
        newSearchParams.set("sort", sortValue)
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
        setSortParam(sortValue)
      } else {
        // createdAt not found in listView
        // Use _id descending as fallback (backend default)
        // Try to find _id column or use explicit sort
        const idIndex = listView.findIndex((col: string) => col.toLowerCase() === "_id" || col.toLowerCase() === "id")
        if (idIndex >= 0) {
          const sortValue = `-${idIndex + 1}`
          console.log(`Setting default sort: _id found at index ${idIndex} in listView, using sort value: ${sortValue}`)
          defaultSortSetRef.current = true
          const newSearchParams = new URLSearchParams(searchParams.toString())
          newSearchParams.set("sort", sortValue)
          router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
          setSortParam(sortValue)
        } else {
          // No createdAt or _id found in listView
          // Backend defaults to _id: -1 when sort is empty
          // Since _id is always in MongoDB documents, we can rely on backend default
          // But let's not set any sort param so backend uses its default _id: -1
          console.log("createdAt/_id not found in listView columns. Backend will use default _id: -1 sort.")
          console.log("Available listView columns:", listView)
          console.log("Note: Backend defaults to _id: -1 (newest first) when sort is empty")
          // Keep sortParam empty so backend uses default _id: -1
          defaultSortSetRef.current = true // Mark that we've checked
        }
      }
    }
  }, [formData?.listView, searchParams, pathname, router, sortParam]) // Run when listView or URL changes

  // Refetch query when sortParam changes (to ensure data is sorted correctly)
  useEffect(() => {
    if (sortParam && formName && !loading) {
      // Query will automatically refetch when queryVariables change (which includes sortParam)
      // But we can also explicitly refetch if needed
      console.log('Sort param changed to:', sortParam, '- query should refetch automatically')
    }
  }, [sortParam, formName, loading])

  // Multi-column URL-based sorting handler
  const updateSortInUrl = useCallback((
    index: number,
    isDesc: boolean | null,
    event: React.MouseEvent
  ) => {
    event.preventDefault()

    const currentSort = searchParams.get("sort") || ""
    let sortArray = currentSort ? currentSort.split(",") : []

    const columnIndex = index + 1
    const columnSort = sortArray.find(s => Math.abs(parseInt(s)) === columnIndex)

    if (isDesc === null) {
      sortArray = sortArray.filter(s => Math.abs(parseInt(s)) !== columnIndex)
    } else if (columnSort) {
      sortArray = sortArray.map(s =>
        Math.abs(parseInt(s)) === columnIndex
          ? (isDesc ? `-${columnIndex}` : `${columnIndex}`)
          : s
      )
    } else {
      sortArray.push(isDesc ? `-${columnIndex}` : `${columnIndex}`)
    }

    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (sortArray.length) newSearchParams.set("sort", sortArray.join(","))
    else newSearchParams.delete("sort")

    // Reset to page 1 when sorting changes
    setPage(1)
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const formateFields = useMemo(() =>
    updateDependentFields(companyDeptFields || []).find(
      (x: any) => x.name?.toLowerCase() === formName.toLowerCase()
    ) || { name: formName, childName: "", fields: [] },
    [companyDeptFields, formName]
  )

  function b64ToBlob(b64: string, mime: string) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    return new Blob([bytes], { type: mime })
  }

  const handleFunctionCall = async (fn: any, params: Record<string, any> = {}) => {
    const variables = { functionName: fn.functionName, params }
    const { data: formRes, error } = await executeDynamicFunction({ variables })
    if (error) {
      const message = error.graphQLErrors?.map((e: any) => e.message).join(", ")
      toast({ title: 'Error', description: message || 'Something went wrong', variant: 'destructive' })
      return
    }
    const res = formRes?.executeDynamicFunction
    if (res?.type === "file") {
      const blob = b64ToBlob(res.base64, res.mimeType)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    }
    if (res?.type === "html") {
      const htmlEl = document.getElementById("html-render")
      if (htmlEl) {
        htmlEl.innerHTML = res.data || ''
        setTimeout(() => { htmlEl.innerHTML = '' }, res.timeout)
      }
    }
    toast({ variant: 'default', title: 'Function executed successfully!' })
  }

  // Memoize query variables to prevent unnecessary refetches
  // Note: getCompanyFunctionsDefault resolver uses user.companyId from context, not orgId parameter
  // But the schema requires orgId, so we pass a dummy value (it will be ignored)
  const orgId = useMemo(() => 'ORG_GEAR', []) // TODO: Make this dynamic - currently ignored by resolver
  const tagsQueryVariables = useMemo(() => ({ formName }), [formName])
  const functionsDefaultVariables = useMemo(() => ({ orgId }), [orgId])
  const functionsAdminVariables = useMemo(() => ({ orgId }), [orgId])

  // Move queries outside MoreInfoLead to prevent unnecessary refetches
  // These queries should only run once per formName, not on every selectedLeads change
  const { data: tagsData } = useQuery(deptQueries.GET_TAGS_BY_FORM_NAME, {
    skip: !formName,
    variables: tagsQueryVariables,
  })

  const { data: defaultFn, loading: defaultFnLoading, error: defaultFnError } = useQuery(adminQueries.getCompanyFunctionsDefault, {
    skip: !formName,
    variables: functionsDefaultVariables,
  })

  // Debug: Log the data to see what we're getting
  useEffect(() => {
    if (defaultFn) {
      console.log('getCompanyFunctionsDefault data:', defaultFn)
      console.log('getCompanyFunctionsDefault functions:', defaultFn?.getCompanyFunctionsDefault)
    }
    if (defaultFnError) {
      console.error('getCompanyFunctionsDefault error:', defaultFnError)
    }
  }, [defaultFn, defaultFnError])

  const { data: companyFunctionsData } = useQuery(adminQueries.getCompnayFunctions, { 
    variables: functionsAdminVariables,
    skip: !formName 
  })

  // Memoize filtered functions at page level to prevent recalculation
  const filteredCompanyFunctions = useMemo(() => {
    if (!companyFunctionsData?.getCompnayFunctionsAdmin || !formName) return []
    return companyFunctionsData.getCompnayFunctionsAdmin.filter((fn: any) =>
      fn.viewName === formName && !fn.individualButton
    ) || []
  }, [companyFunctionsData?.getCompnayFunctionsAdmin, formName])

  const filteredIndividualFunctions = useMemo(() => {
    // Use getCompnayFunctionsAdmin instead of getCompanyFunctionsDefault to match child modal logic
    // Filter for functions with individualButton: true and functionType is BOTH or BULK
    if (!companyFunctionsData?.getCompnayFunctionsAdmin || !formName) return []
    const filtered = companyFunctionsData.getCompnayFunctionsAdmin.filter((fn: any) => 
      fn.viewName === formName && 
      fn.individualButton === true && 
      (fn.functionType === "BOTH" || fn.functionType === "BULK")
    )
    console.log('filteredIndividualFunctions:', filtered, 'for formName:', formName)
    console.log('All functions from getCompnayFunctionsAdmin:', companyFunctionsData.getCompnayFunctionsAdmin)
    return filtered
  }, [companyFunctionsData?.getCompnayFunctionsAdmin, formName])

  const prevTags = useMemo(() => tagsData?.getTagsByFormName || [], [tagsData?.getTagsByFormName])

  const MoreInfoLead = memo(({ selectedLeads }: { selectedLeads: any[] }) => {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [selectedFn, setSelectedFn] = useState<any>(null)
    const selectedIds = useMemo(() => selectedLeads.map(l => l._id), [selectedLeads])
    const hasCreatePermission = checkPermission(`CREATE:${formName.toUpperCase()}`)

    const handleSubmitClick = () => {
      if (!selectedFn) return
      if (selectedFn.isUserIntervation) {
        onOpen("functionParameters", {
          id: selectedFn.id,
          selectedFnName: selectedFn.functionName,
          selectedData: selectedLeads,
          selectedFormNameIds: selectedIds,
          formName,
          formNameIds: selectedIds.slice(0,2),
          unselectedFormNameIds: unselectedRows,
        })
      } else {
        handleFunctionCall(selectedFn, { ids: selectedIds })
        setPopoverOpen(false)
      }
    }

    return (
      <div className="flex flex-wrap gap-2 justify-end">
        <Popover open={popoverOpen} onOpenChange={o => setPopoverOpen(o)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-[200px] justify-between min-w-[150px]">
              <span className="truncate">{selectedFn?.functionName || 'Select function...'}</span>
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[90vw] md:w-[220px] p-0">
            <div className="p-2 border-b flex justify-end">
              <Button size="sm" onClick={handleSubmitClick} disabled={!selectedFn}>
                Submit
              </Button>
            </div>
            <Command>
              <CommandInput placeholder="Search function…" />
              <CommandList>
                <CommandEmpty>No function found.</CommandEmpty>
                <CommandGroup>
                  {filteredCompanyFunctions.map((fn: any) => (
                    <CommandItem
                      key={fn.functionName}
                      value={fn.functionName}
                      onSelect={() => setSelectedFn(fn)}
                      className="flex items-center gap-2"
                    >
                      <div className={cn(
                        "h-4 w-4 border rounded-sm flex items-center justify-center",
                        selectedFn?.functionName === fn.functionName
                          ? "bg-primary text-white"
                          : "bg-transparent"
                      )}>
                        {selectedFn?.functionName === fn.functionName && <CheckIcon className="w-3 h-3" />}
                      </div>
                      <span>{fn.functionName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {filteredIndividualFunctions.map((fn: any) => (
          <Button
            key={fn.id}
            variant="default"
            size="sm"
            className="items-center gap-1 whitespace-nowrap"
            onClick={() => {
              // Check if function requires user intervention (parameters)
              if (fn.isUserIntervation) {
                onOpen("functionParameters", {
                  id: fn.id,
                  selectedFnName: fn.functionName,
                  selectedData: selectedLeads,
                  selectedFormNameIds: selectedIds,
                  formName,
                  formNameIds: selectedIds.slice(0,2),
                  unselectedFormNameIds: unselectedRows,
                })
              } else {
                handleFunctionCall(fn, { ids: selectedIds, unselectedIds: [] })
              }
            }}
          >
            <span className="hidden md:inline">{fn.functionName}</span>
            <span className="md:hidden">{fn.functionName.length > 10 ? fn.functionName.substring(0, 10) + '...' : fn.functionName}</span>
          </Button>
        ))}

        {hasCreatePermission && (
          <>
            <Button
              variant="default"
              size="sm"
              className="items-center gap-1 whitespace-nowrap"
              onClick={() => onOpen("uploadFormModal", {
                formName,
                fields: formateFields,
                existingTags: prevTags,
                refetch
              })}
            >
              <UploadIcon size={15} className="flex-shrink-0" />
              <span className="hidden md:inline">Upload {formName}</span>
              <span className="md:hidden">Upload</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className="items-center gap-1 whitespace-nowrap"
              onClick={() => onOpen("submitLead", { fields: formateFields, refetch })}
            >
              <PlusCircleIcon size={15} className="flex-shrink-0" /> 
              <span className="hidden md:inline">Add New {formName}</span>
              <span className="md:hidden">Add New</span>
            </Button>
          </>
        )}
      </div>
    )
  })
  
  MoreInfoLead.displayName = 'MoreInfoLead'

  return (
    <Card className="w-full max-w-7xl mx-auto my-4 px-2 md:px-6">
      <CardHeader className="px-2 md:px-6">
        <CardTitle className="text-base md:text-lg font-bold text-gray-700 break-words">{formName}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 md:px-6 overflow-x-auto">
        <AdvancedDataTableForms
          dependentCols={[]}
          columnNames={formData.listView || []}
          changeView={formData.changeView || []}
          data={displayData}
          pagination={displayPagination}
          MoreInfo={MoreInfoLead}
          tableName={formName}
          onUnselectedRowsChange={setUnselectedRows}
          sortParam={sortParam}
          updateSortInUrl={updateSortInUrl}
          searchParams={searchParams}
          pathname={pathname}
          currentPage={page}
          onPageChange={handlePageChange}
          onFiltersChange={handleFiltersChange}
          filterData={filterData?.getFormValuesByFormName?.data || []}
        />
      </CardContent>
    </Card>
  )
}
