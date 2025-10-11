"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

import AdvancedDataTableForms from "@/components/advance-data-table-forms"
import { useCompany } from "@/components/providers/CompanyProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useModal } from "@/hooks/use-modal-store"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { companyQueries } from "@/lib/graphql/company/queries"
import { companyMutation } from "@/lib/graphql/company/mutation"
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

export default function Page({ params }: { params: { formName: string } }) {
  const [unselectedRows, setUnselectedRows] = useState<string[]>([])
  const formName = decodeURIComponent(params?.formName)
  const { onOpen } = useModal()
  const { companyDeptFields } = useCompany()
  const { toast } = useToast()

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // multi-column sort string
  const [sortParam, setSortParam] = useState<string>("")
  // pagination
  const [page, setPage] = useState<number>(1)
  const limit = 10
  // filters
  const [filters, setFilters] = useState<Record<string, any>>({})
  // search results for hybrid filtering
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  // Debug all page changes
  useEffect(() => {
    console.log('Page state changed to:', page);
  }, [page]);

  const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE)

  // Memoize variables to prevent infinite refetch
  const queryVariables = useMemo(() => {
    console.log('queryVariables updated:', { formName, filters, page, limit, sortParam });
    return {
      formName,
      filters,
      page,
      limit,
      sort: sortParam,
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

  // Debug filter data loading
  console.log('Filter Data Status:', {
    loading: filterDataLoading,
    error: filterDataError,
    hasData: !!filterData,
    dataLength: filterData?.getFormValuesByFormName?.data?.length || 0
  });

  // Search query for database-wide search
  const { refetch: searchFormValueRefetch } = useQuery(companyQueries.SEARCH_FORM_VALUE, {
    skip: true // Skip by default, we'll trigger it manually
  })


  // Handle page changes from child component
  const handlePageChange = (newPage: number) => {
    console.log('handlePageChange called:', { from: page, to: newPage });
    console.log('Calling setPage with:', newPage);
    setPage(newPage)
    // The query will automatically refetch when the page state changes
    // because page is in the variables object
  }

  // Handle filter changes from child component with hybrid filtering
  const handleFiltersChange = async (newFilters: Record<string, any>) => {
    console.log('handleFiltersChange called:', { newFilters, currentPage: page });
    
    // Get the 50 rows data for filtering
    const filterDataRows = filterData?.getFormValuesByFormName?.data || [];
    console.log('Filter data rows:', { 
      filterDataExists: !!filterData, 
      filterDataRowsLength: filterDataRows.length,
      filterDataRows: filterDataRows.slice(0, 3) // Show first 3 rows for debugging
    });
    
    // For now, let's just implement the basic filtering without the complex hybrid logic
    // We'll set the filters and let the normal flow handle it
    setFilters(newFilters);
    setPage(1);
    
    // TODO: Implement the hybrid filtering logic step by step
    console.log('Basic filter change applied, hybrid logic to be implemented');
  }

  // Initialize sort param from URL on mount
  useEffect(() => {
    const urlSort = searchParams.get("sort") || ""
    console.log('Initializing sort from URL:', { urlSort, currentSortParam: sortParam });
    if (urlSort !== sortParam) {
      setSortParam(urlSort)
    }
  }, []) // Only run on mount

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
    console.log('Resetting page to 1 due to sort change');
    setPage(1)
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  // our payload now comes back as
  // { data, pagination, listView, changeView }
  const formData = data?.getFormValuesByFormName || {}
  
  // For now, just use normal data (we'll implement search mode later)
  const displayData = formData.data || [];
  const displayPagination = formData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  
  // Debug the data being passed to the table
  console.log('FormData received:', {
    dataLength: displayData.length,
    pagination: displayPagination,
    currentPage: page,
    listView: formData.listView
  });
  

  const formateFields = useMemo(() =>
    updateDependentFields(companyDeptFields || []).find(
      (x: any) => x.name?.toLowerCase() === formName.toLowerCase()
    ) || [],
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

  const MoreInfoLead = ({ selectedLeads }: { selectedLeads: any[] }) => {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [selectedFn, setSelectedFn] = useState<any>(null)
    const [companyFunctions, setCompanyFunctions] = useState<any[]>([])
    const [individualCompanyFunctions, setIndividualCompanyFunctions] = useState<any[]>([])
    const [prevTags, setPrevTags] = useState<string[]>([])
    const selectedIds = selectedLeads.map(l => l._id)

    useQuery(deptQueries.GET_TAGS_BY_FORM_NAME, {
      skip: !formName,
      variables: { formName },
      onSuccess: ({ data }: { data: any }) => {
        setPrevTags(data?.getTagsByFormName || [])
      },
    })

    const { data: defaultFn } = useQuery(adminQueries.getCompanyFunctionsDefault, {
      skip: !formName,
      variables: { orgId: 'ORG_GEAR' }, // TODO: Make this dynamic
    })
    useEffect(() => {
      if (defaultFn?.getCompanyFunctionsDefault && formName) {
        setIndividualCompanyFunctions(
          defaultFn.getCompanyFunctionsDefault.filter((fn: any) =>
            fn.viewName === formName && fn.functionType !== 'INDIVIDUAL'
          )
        )
      }
    }, [defaultFn, formName])

    const { data: companyFunctionsData } = useQuery(adminQueries.getCompnayFunctions, { 
      variables: { orgId: 'ORG_GEAR' }, // TODO: Make this dynamic
      skip: !formName 
    })
    
    useEffect(() => {
      if (companyFunctionsData?.getCompnayFunctionsAdmin && formName) {
        setCompanyFunctions(
          companyFunctionsData.getCompnayFunctionsAdmin.filter((fn: any) =>
            fn.viewName === formName && !fn.individualButton
          ) || []
        )
      }
    }, [companyFunctionsData, formName])

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
      <div className="flex gap-2 ml-auto">
        <Popover open={popoverOpen} onOpenChange={o => setPopoverOpen(o)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              {selectedFn?.functionName || 'Select function...'}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0">
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
                  {companyFunctions.map(fn => (
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

        {individualCompanyFunctions.map(fn => (
          <Button
            key={fn.id}
            variant="default"
            size="sm"
            className="items-center gap-1"
            onClick={() => handleFunctionCall(fn, { ids: selectedIds, unselectedIds: [] })}
          >
            {fn.functionName}
          </Button>
        ))}

        <Button
          variant="default"
          size="sm"
          className="items-center gap-1"
          onClick={() => onOpen("uploadFormModal", {
            formName,
            fields: formateFields,
            existingTags: prevTags
          })}
        >
          <UploadIcon size={15} />
          <span>Upload {formName}</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          className="items-center gap-1"
          onClick={() => onOpen("submitLead", { fields: formateFields })}
        >
          <PlusCircleIcon size={15} /> <span>Add New {formName}</span>
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-7xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-700">{formName}</CardTitle>
      </CardHeader>
      <div
        id="html-render"
        style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          maxWidth: '500px',
          maxHeight: '150px',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}
      ></div>
      <CardContent>
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
