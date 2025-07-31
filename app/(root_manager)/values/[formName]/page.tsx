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

  const [sortParam, setSortParam] = useState<string>("")

  const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE)

  const { data, loading, error, refetch } = useQuery(companyQueries.GET_SUBMITTED_FORM_VALUE, {
    variables: { formName, sort: sortParam },
    notifyOnNetworkStatusChange: true,
  })

  // Sync sort param from URL
  useEffect(() => {
    const urlSort = searchParams.get("sort") || ""
    setSortParam(urlSort)
    refetch({ formName, sort: urlSort })
  }, [searchParams, formName, refetch])

  // Multi-column URL-based sorting handler
  const updateSortInUrl = useCallback((index: number, isDesc: boolean | null, event: React.MouseEvent) => {
    event.preventDefault()

    const currentSort = searchParams.get("sort") || ""
    let sortArray = currentSort ? currentSort.split(",") : []

    const columnIndex = index + 1
    const columnSort = sortArray.find(s => Math.abs(parseInt(s)) === columnIndex)

    if (isDesc === null) {
      sortArray = sortArray.filter(s => Math.abs(parseInt(s)) !== columnIndex)
    } else {
      if (columnSort) {
        sortArray = sortArray.map(s =>
          Math.abs(parseInt(s)) === columnIndex ? (isDesc ? `-${columnIndex}` : `${columnIndex}`) : s
        )
      } else {
        sortArray.push(isDesc ? `-${columnIndex}` : `${columnIndex}`)
      }
    }

    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (sortArray.length > 0) {
      newSearchParams.set("sort", sortArray.join(","))
    } else {
      newSearchParams.delete("sort")
    }

    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const formData = data?.getFormValuesByFormName

  const formateFields = useMemo(() =>
    updateDependentFields(companyDeptFields || []).find(
      (x: any) => x.name?.toLowerCase() === formName.toLowerCase()
    ) || [], [companyDeptFields, formName]
  )

  function b64ToBlob(b64: string, mime: string) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  }

  const handleFunctionCall = async (fn: any, params: Record<string, any> = {}) => {
    const variables = {
      functionName: fn.functionName,
      params: params,
    }
    const { data: formRes, error } = await executeDynamicFunction({ variables })
    console.log("Function execution response:", formRes.executeDynamicFunction, error);
    if (error) {
      const message = error.graphQLErrors?.map((e: any) => e.message).join(", ")
      toast({ title: 'Error', description: message || 'Something went wrong', variant: 'destructive' })
      return
    }
    const res = formRes?.executeDynamicFunction;
    if (res?.type === "file") {
      const blob = b64ToBlob(res.base64, res.mimeType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (res?.type === "html") {
      const htmlElement = document.getElementById("html-render");
      if (htmlElement) {
        htmlElement.innerHTML = res.data || '';

        setTimeout(() => {
          htmlElement.innerHTML = '';
        }, res?.timeout);
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
    const selectedIds = selectedLeads.map(lead => lead._id)

    useQuery(deptQueries.GET_TAGS_BY_FORM_NAME, {
      skip: !formName,
      variables: { formName },
      onSuccess: ({ data }: { data: any }) => {
        setPrevTags(data?.getTagsByFormName || [])
      },
    })

    const { data } = useQuery(adminQueries.getCompanyFunctionsDefault, {
      skip: !formName,
      variables: { orgId: 'ORG_GEAR' },
    });

    useEffect(() => {
      if (data?.getCompanyFunctionsDefault && formName) {
        setIndividualCompanyFunctions(
          data.getCompanyFunctionsDefault.filter((fn: any) => fn.viewName === formName && fn.functionType !== 'INDIVIDUAL')
        );
      }
    }, [data, formName]);

    const funcs = useQuery(adminQueries.getCompnayFunctions, {
      variables: { orgId: 'ORG_GEAR' },
      skip: true,
      onSuccess: ({ data }: { data: any }) => {
        setCompanyFunctions(
          data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === formName && !fn.individualButton) || []
        )
      }
    })

    const fetchCompanyFunctions = async () => {
      const { data } = await funcs.refetch()
      if (data?.getCompnayFunctionsAdmin) {
        setCompanyFunctions(
          data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === formName && !fn.individualButton)
        )
      }
    }

    const handlePopoverChange = (open: boolean) => {
      setPopoverOpen(open)
      if (open) fetchCompanyFunctions()
      else {
        setCompanyFunctions([])
        setSelectedFn(null)
      }
    }

    const onSelectFunction = (fnName: string) => {
      const fn = companyFunctions.find((f: any) => f.functionName === fnName) || null
      setSelectedFn(fn)
    }

    const handleSubmitClick = () => {
      if (!selectedFn) return
      if (selectedFn.isUserIntervation) {
        onOpen("functionParameters", {
          id: selectedFn.id,
          selectedFnName: selectedFn.functionName,
          selectedData: selectedLeads,
          selectedFormNameIds: selectedIds,
          formName,
          formNameIds: selectedIds.slice(0, 2),
          unselectedFormNameIds: unselectedRows,
        })
      } else {
        handleFunctionCall(selectedFn)
        setPopoverOpen(false)
      }
    }

    return (
      <div className="flex gap-2 ml-auto">
        <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              {selectedFn ? selectedFn.functionName : 'Select function...'}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  {companyFunctions.map((item: any) => (
                    <CommandItem
                      key={item.functionName}
                      value={item.functionName}
                      onSelect={onSelectFunction}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "h-4 w-4 border rounded-sm flex items-center justify-center transition",
                          selectedFn?.functionName === item.functionName ? "bg-primary text-white" : "bg-transparent"
                        )}
                      >
                        {selectedFn?.functionName === item.functionName && (
                          <CheckIcon className="w-3 h-3" />
                        )}
                      </div>
                      <span>{item.functionName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {individualCompanyFunctions.map((fn: any) => (
          <Button
            key={fn.id}
            variant="default"
            size="sm"
            className="items-center gap-1"
            onClick={() => handleFunctionCall(fn, {
              ids: selectedLeads.map(lead => lead._id),
              unselectedIds: []// unselectedRows
            })}
          >
            <span>{fn.functionName}</span>
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
          onClick={() => onOpen("submitLead", { fields: formateFields })}
          variant="default"
          size="sm"
          className="items-center gap-1"
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
          columnNames={formData?.listView || []}
          changeView={formData?.changeView || []}
          data={formData?.data || []}
          MoreInfo={MoreInfoLead}
          tableName={formName}
          onUnselectedRowsChange={setUnselectedRows}
          sortParam={sortParam}
          updateSortInUrl={updateSortInUrl}
          searchParams={searchParams}
          pathname={pathname}
        />
      </CardContent>
    </Card>
  )
}
