"use client";
import { useAtom } from "jotai";
import { useState } from "react";

import { leads } from "@/lib/atom/leadAtom";
import { Button } from "../ui/button";
import { PlusCircle, UploadIcon } from "lucide-react";
import { useCompany } from "../providers/CompanyProvider";
import { useModal } from "@/hooks/use-modal-store";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AdvanceDataTable from "../Table/advance-table";
import { useMutation, useQuery } from "graphql-hooks";
import { leadMutation } from "@/lib/graphql/lead/mutation";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { useToast } from "../ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { userQueries } from "@/lib/graphql/user/queries";

export const LeadTable = () => {

  const [leadInfo]: any = useAtom(leads);
  
  const { onOpen } = useModal();
  // const { companyFunctions } = useCompany();

  const { toast } = useToast();
  const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE);

  

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
    const [loadingFunctions, setLoadingFunctions] = useState(false);

    const fetchCompanyFunctions = async () => {
      setLoadingFunctions(true);
      // Use your GraphQL client directly or useQuery with manual trigger
      const { data } = await funcs.refetch(); // You'll need to move useQuery into this scope
      if (data?.getCompanyFunctions) setCompanyFunctions(data.getCompanyFunctions);
      setLoadingFunctions(false);
    };
  
    // useQuery here but SKIP by default
    const funcs = useQuery(userQueries.GET_COMPANY_FUNCTION, { skip: true })

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
      } else {
        handleFunctionCall(selectedFn);
        setPopoverOpen(false);
      }
    };

    const handleFormChange = (key: string, value: any) => {
      setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFormSubmit = () => {
      if (!selectedFn) return;
      handleFunctionCall(selectedFn, formValues);
      setShowForm(false);
      setSelectedFn(null);
      setPopoverOpen(false);
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
            {showForm && selectedFn?.variables && (
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
            )}
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => onOpen('assignLead', { leads: selectedLeads, apiUrl: leadMutation.LEAD_ASSIGN_TO, query: 'Lead' })}
          variant="default"
          size="sm"
          className="items-center gap-1"
          disabled={!selectedLeads.length}
        >
          Assign Lead
        </Button>
        <Button
          variant="default"
          size="sm"
          className="items-center gap-1"
          onClick={() => onOpen('uploadLeadModal', { fields: addLeadForm })}
        >
          <UploadIcon size={15} />
          <span>Upload Lead</span>
        </Button>
        <Button
          onClick={() => onOpen('addLead', { fields: addLeadForm })}
          variant="default"
          size="sm"
          className="items-center gap-1"
        >
          <PlusCircle size={15} />
          <span>Add New Lead</span>
        </Button>
      </div>
    );
  };

  const addLeadForm = useCompany().optForms?.find((x: any) => x.name === "Lead");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between font-bold">Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <AdvanceDataTable
          filterOption={leadInfo?.filterOptions || {}}
          optOutFields={leadInfo?.optOutFields || []}
          changeView={leadInfo?.changeView}
          columnNames={leadInfo?.listView}
          data={leadInfo?.data as any || []}
          MoreInfo={MoreInfoLead}
          tableName="Lead"
          pagination={leadInfo?.pagination}
        />
      </CardContent>
    </Card>
  );
};
