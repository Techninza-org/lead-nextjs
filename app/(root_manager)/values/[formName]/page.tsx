"use client"
import AdvancedDataTableForms from "@/components/advance-data-table-forms";
import AdvancedDataTableFormsDynamic from "@/components/advance-data-table-forms-dynamic";
import { useCompany } from "@/components/providers/CompanyProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal-store";
import { adminQueries } from "@/lib/graphql/admin/queries";
import { companyQueries } from "@/lib/graphql/company/queries";
import { cn, updateDependentFields } from "@/lib/utils";
import { useMutation, useQuery } from "graphql-hooks";
import { CheckIcon, ChevronsUpDownIcon, PlusCircleIcon, UploadIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { deptQueries } from "@/lib/graphql/dept/queries";

export default function Page({ params }: { params: { formName: string } }) {
  const [companyFunctions, setCompanyFunctions] = useState([])
  const [selectedFn, setSelectedFn] = useState<any>(null);

    
    const formName = decodeURIComponent(params?.formName);
   
   
    const { onOpen } = useModal()
    const { companyDeptFields } = useCompany()

    const { toast } = useToast();
    const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE);
   
      const { data, loading, error } = useQuery(companyQueries.GET_SUBMITTED_FORM_VALUE, {
          variables: {
              formName
          }
      })
      const formData = data?.getFormValuesByFormName;

    const formateForms = updateDependentFields(companyDeptFields || [])
    const formateFields = useMemo(() => formateForms?.find((x: any) => x.name?.toLowerCase() === formName?.toLowerCase()) || [], [formateForms, formName])

    // const MoreInfoLead = useCallback(({ selectedLeads }: { selectedLeads: any[] }) => {
    //     return (
    //         <div className="flex gap-2 ml-auto">
    //             <Button
    //                 onClick={() => onOpen("submitLead", { fields: formateFields })}
    //                 variant={'default'}
    //                 size={"sm"}
    //                 className="items-center gap-1">
    //                 <PlusCircleIcon size={15} /> <span>Add New {formName}</span>
    //             </Button>
    //         </div>
    //     )
    // }, [formName, formateFields, onOpen])

    const handleFunctionCall = async (fn: any, params: Record<string, any> = {}) => {
      const variables = {
        functionName: fn.functionName,
        params: JSON.stringify(params),
      };
      const { data: formRes, error } = await executeDynamicFunction({ variables });
      if (error) {
        const message = error.graphQLErrors?.map((e: any) => e.message).join(", ");
        toast({ title: 'Error', description: message || 'Something went wrong', variant: 'destructive' });
        return;
      }
      toast({ variant: 'default', title: 'Function executed successfully!' });
    };
  
    const MoreInfoLead = ({ selectedLeads }: { selectedLeads: any[] }) => {
      const [popoverOpen, setPopoverOpen] = useState(false);
      const [selectedFn, setSelectedFn] = useState<any>(null);
      const [formValues, setFormValues] = useState<Record<string, any>>({});
      const [showForm, setShowForm] = useState(false);
      const [companyFunctions, setCompanyFunctions] = useState<any[]>([])
      const [individualCompanyFunctions, setIndividualCompanyFunctions] = useState<any[]>([])
      const [loadingFunctions, setLoadingFunctions] = useState(false);
      const [prevTags, setPrevTags] = useState<string[]>([]);
      const selectedIds = selectedLeads.map(lead => lead._id);

      const { } = useQuery(deptQueries.GET_TAGS_BY_FORM_NAME, {
        skip: !formName,
        variables: {
           formName: formName
        },
        onSuccess: ({ data }: {data: any}) => {
           const tags = data?.getTagsByFormName || [];
           setPrevTags(tags);
        },
     })

      const { } = useQuery(adminQueries.getCompanyFunctionsDefault, {
        variables: {
           orgId: 'ORG_GEAR'
        },
        onSuccess: ({ data }: {data: any}) => {
           console.log(data, "data")
           const filteredFunctions = data?.getCompanyFunctionsDefault?.filter((fn: any) => fn.viewName === formName) || [];
           setIndividualCompanyFunctions(filteredFunctions);
        },
     })
  
      const fetchCompanyFunctions = async () => {
        setLoadingFunctions(true);
        // Use your GraphQL client directly or useQuery with manual trigger
        const { data } = await funcs.refetch(); // You'll need to move useQuery into this scope
        if (data?.getCompnayFunctionsAdmin) {
          const filteredFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === formName && !fn.individualButton) || [];
          setCompanyFunctions(filteredFunctions);
        }
        setLoadingFunctions(false);
      };
    
      // useQuery here but SKIP by default
      const funcs = useQuery(adminQueries.getCompnayFunctions, { variables: {
        orgId: 'ORG_GEAR' // Replace with actual org ID or use context
      }, skip: true, onSuccess: ({ data }: { data: any }) => {
        const filteredFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === formName && !fn.individualButton) || [];
        setCompanyFunctions(filteredFunctions);
      } })
  
      const handlePopoverChange = (open: boolean) => {
        setPopoverOpen(open);
        if (open) {
          // Only fetch when opening
          fetchCompanyFunctions();
        } else {
          // Clear on close
          setCompanyFunctions([]);
          setSelectedFn(null);
          setShowForm(false);
        }
      };
  
      const onSelectFunction = (fnName: string) => {
        const fn = companyFunctions.find((f: any) => f.functionName === fnName) || null;
        setSelectedFn(fn);
        setFormValues({});
        setShowForm(false);
      };
  
      const handleSubmitClick = () => {
        if (!selectedFn) return;
        if (selectedFn.isUserIntervation) {
          setShowForm(true);
          onOpen("functionParameters", {id: selectedFn.id, selectedFnName: selectedFn.functionName, selectedFormNameIds: selectedIds });
        } else {
          handleFunctionCall(selectedFn);
          setPopoverOpen(false);
        }
      };
  
      return (
        <div className="flex gap-2 ml-auto">
          <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-[200px] justify-between"
              >
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
              {/* {showForm && (
                <div className="p-4 space-y-3 border-t">
                  {selectedFn.variables.map((v: any) => (
                    <div key={v} className="flex flex-col">
                      <label className="text-sm font-medium">{v}</label>
                      <input
                        type="text"
                        value={formValues[v] || ''}
                        onChange={e => handleFormChange(v, e.target.value)}
                        className="mt-1 p-1 border rounded"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleFormSubmit}>
                      Execute
                    </Button>
                  </div>
                </div>
              )} */}
            </PopoverContent>
          </Popover>
         {individualCompanyFunctions.map((fn: any) => (
          <Button
            key={fn.id}
            variant={'default'}
            size={"sm"}
            className="items-center gap-1"
            onClick={() => handleFunctionCall(fn, { ids: selectedLeads.map(lead => lead._id) })}
          >
            <span>{fn.functionName}</span>
          </Button>
         ))}
          <Button
          variant="default"
          size="sm"
          className="items-center gap-1"
          onClick={() => onOpen('uploadFormModal', { formName: formName, fields: formateFields, existingTags: prevTags })}
        >
          <UploadIcon size={15} />
          <span>Upload {formName}</span>
        </Button>
          <Button
                    onClick={() => onOpen("submitLead", { fields: formateFields })}
                    variant={'default'}
                    size={"sm"}
                    className="items-center gap-1">
                    <PlusCircleIcon size={15} /> <span>Add New {formName}</span>
                </Button>
        </div>
      )
    };

    return (
        <Card className="w-full max-w-7xl mx-auto my-4">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-700">{formName}</CardTitle>
            </CardHeader>
            <CardContent>
                <AdvancedDataTableForms
                    dependentCols={[]}
                    columnNames={formData?.listView || []}
                    changeView={formData?.changeView || []}
                    data={formData?.data || []}
                    MoreInfo={MoreInfoLead}
                    tableName={formName}
                />
            </CardContent>
        </Card>
    )
}