import React, { useState, useMemo, useEffect } from 'react';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/hooks/use-modal-store";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   MoreHorizontal,
   Plus,
   ChevronDown,
   ChevronRight,
   X,
   PencilIcon,
   ChevronsUpDownIcon,
   CheckIcon,
   Edit,
   Edit2Icon,
   Edit3,
   PencilLineIcon,
   Pen,
   History
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { cn, updateDependentFields } from '@/lib/utils';
import { useCompany } from '../providers/CompanyProvider';
import { useMutation, useQuery } from 'graphql-hooks';
import { companyQueries } from '@/lib/graphql/company/queries';
import { useToast } from '../ui/use-toast';
import { DeptMutation } from '@/lib/graphql/dept/mutation';
import { adminQueries } from '@/lib/graphql/admin/queries';
import { companyMutation } from '@/lib/graphql/company/mutation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList
} from "@/components/ui/command"
import { Select } from '../ui/select';
import { deptQueries } from '@/lib/graphql/dept/queries';
import { usePermissions } from '../providers/PermissionContext';

export const ChildDetailsModal = () => {
   const { isOpen, onClose, onOpen, type, data: modalData } = useModal();
   const { companyDeptFields } = useCompany()
   const { toast } = useToast();
   const { checkPermission } = usePermissions();
   
   const [popoverOpen, setPopoverOpen] = useState(false)
   const [tableData, setTableData] = useState<Record<string, any[]>>({});
   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
   const [companyFunctions, setCompanyFunctions] = useState<any[]>([]);
   const [individualButtonFunctions, setIndividualButtonFunctions] = useState<any[]>([]);
   const [activeForm, setActiveForm] = useState<string | null>(null);
   const [childRows, setChildRows] = useState<Record<string, any[]>>({});
   const [editingKey, setEditingKey] = useState<string | null>(null);
   const [editedValue, setEditedValue] = useState<string>("");
   const [editOptions, setEditOptions] = useState<Record<string, any>>({});
   const [mainData, setMainData] = useState<any>(null);
   const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
   const [editingTableName, setEditingTableName] = useState<string | null>(null);
   const [selectedFn, setSelectedFn] = useState<any>(null);

   const [addChildToParent] = useMutation(DeptMutation.ADD_CHILD_TO_PARENT)
   const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE);

   // Memoize query variables to prevent unnecessary refetches
   const optionsQueryVariables = useMemo(() => {
      // Only create variables if both are available, otherwise return empty object
      if (!editingKey || !modalData?.table?.label) {
         return { key: "", formName: "" }
      }
      return {
         key: editingKey,
         formName: modalData.table.label
      }
   }, [editingKey, modalData?.table?.label])

   // Query to get edit options - only run when both editingKey and formName are available
   const { data: optionsData, refetch: refetchOptions } = useQuery(deptQueries.GET_OPTIONS, {
      variables: optionsQueryVariables,
      skip: !editingKey || !modalData?.table?.label, // Use skip instead of pause for better control
   });

   useEffect(() => {
      if (optionsData?.getOptions?.length > 0) {
         setEditOptions(optionsData.getOptions); // Use the array directly
      } else {
         setEditOptions([]);
      }
   }, [optionsData]);

   const [editFieldValue] = useMutation(`
      mutation EditFieldValue($formName: String!, $docId: String!, $values: JSON!) {
        editFieldValue(formName: $formName, docId: $docId, values: $values)
      }
   `);

   useEffect(() => {
      if (modalData?.table?.data) {
         setMainData(modalData.table.data);
      }
      if (modalData?.table?.data?.children) {
         setTableData(prevData => ({
            ...prevData,
            ...modalData.table.data.children
         }));
      }
   }, [modalData?.table?.data]);

   // Functions are now automatically fetched via useQuery when modal opens

   const handleEditClick = (key: string, value: string, documentId?: string, tableName?: string) => {
      // Check UPDATE permission before allowing edit
      const formName = tableName || modalData?.table?.label || '';
      if (!checkPermission(`UPDATE:${formName.toUpperCase()}`)) {
         toast({
            title: "Permission Denied",
            description: "You do not have permission to update this form",
            variant: "destructive",
         });
         return;
      }
      
      setEditingKey(key);
      setEditedValue(value);
      setEditingDocumentId(documentId || null);
      setEditingTableName(tableName || null);
      refetchOptions(); // Trigger fetching of options
   };

   const handleSave = async (key: string) => {
      if (!editedValue.trim()) {
         toast({
            title: "Error",
            description: "Value cannot be empty",
            variant: "destructive",
         });
         return;
      }

      try {
         const { data } = await editFieldValue({
            variables: {
               formName: editingTableName || modalData?.table?.label,
               docId: editingDocumentId || modalData?.table?.data?._id,
               values: { [key]: editedValue },
            },
         });

         if (data?.editFieldValue) {
            toast({
               title: "Success",
               description: `Updated ${key} successfully!`,
               variant: "default",
            });

            // Update the main data state
            setMainData((prev: any) => ({
               ...prev,
               [key]: editedValue
            }));

            // Also update tableData if it exists
            setTableData((prev) => ({
               ...prev,
               [modalData.table.label]: (prev[modalData.table.label] || []).map((item: any) =>
                  item._id === modalData.table.data._id ? { ...item, [key]: editedValue } : item
               ),
            }));
         } else {
            throw new Error("Update failed");
         }
      } catch (err) {
         console.error('Edit field value error:', err);
         toast({
            title: "Error",
            description: "Failed to update value",
            variant: "destructive",
         });
      }

      setEditingKey(null);
      setEditedValue("");
      setEditOptions([]);
   };



   const formateForms = updateDependentFields(companyDeptFields || [])
   const formateFields: any = useMemo(() => formateForms?.find((x: any) => x.name === modalData?.table?.label) || { name: modalData?.table?.label || "", childName: "", fields: [] }, [formateForms, modalData?.table?.label])

   const childTables = Object
      .entries(formateFields.fields || {})
      .filter(([key, def]) =>
         key !== modalData.table?.label
         && Array.isArray(def)
         && def.length > 0
      ) as [string, any[]][];
   const parentId = modalData?.table?.data?._id;
   const childTableNames = childTables.map(([name]) => name);

   const { } = useQuery(companyQueries.GET_CHILD_DATA, {
      skip: !parentId || childTableNames.length === 0,
      variables: { parentId, childTableNames },
      onSuccess: ({ data }: { data: any }) => {
         // data.getChildFromParent is an array of arrays, in same order as childTableNames
         const mapping: Record<string, any[]> = {};
         childTableNames.forEach((tbl, i) => {
            mapping[tbl] = data.getChildFromParent[i] || [];
         });
         setChildRows(mapping);
      },
   });

   // Memoize query variables to prevent unnecessary refetches
   const functionsQueryVariables = useMemo(() => ({
      orgId: 'ORG_GEAR' // TODO: Replace with actual org ID or use context
   }), [])

   // Query company functions - only run when modal is open and has table data
   const { data: funcsData } = useQuery(adminQueries.getCompnayFunctions, {
      variables: functionsQueryVariables,
      skip: !isOpen || !modalData?.table?.label,
   })

   // Memoize filtered functions to prevent unnecessary state updates
   const filteredCompanyFunctionsForModal = useMemo(() => {
      if (!funcsData?.getCompnayFunctionsAdmin || !modalData?.table?.label) return []
      return funcsData.getCompnayFunctionsAdmin.filter((fn: any) => 
         fn.viewName === modalData.table.label && fn.functionType !== "BULK" && fn.individualButton === false
      ) || []
   }, [funcsData?.getCompnayFunctionsAdmin, modalData?.table?.label])

   const filteredIndividualFunctionsForModal = useMemo(() => {
      if (!funcsData?.getCompnayFunctionsAdmin || !modalData?.table?.label) return []
      // Show functions with individualButton: true and functionType is BOTH or BULK
      return funcsData.getCompnayFunctionsAdmin.filter((fn: any) => 
         fn.viewName === modalData.table.label && 
         fn.individualButton === true && 
         (fn.functionType === "BOTH" || fn.functionType === "BULK")
      ) || []
   }, [funcsData?.getCompnayFunctionsAdmin, modalData?.table?.label])

   // Update state only when filtered results actually change
   useEffect(() => {
      setCompanyFunctions(filteredCompanyFunctionsForModal)
   }, [filteredCompanyFunctionsForModal])

   useEffect(() => {
      setIndividualButtonFunctions(filteredIndividualFunctionsForModal)
   }, [filteredIndividualFunctionsForModal]);

   const defaultValues = useMemo(() => {
      const fields = formateFields?.fields;
      if (!fields) return {};

      // CASE A: fields is an array → a single “flat” form
      if (Array.isArray(fields)) {
         return fields.reduce((acc, f: any) => {
            acc[f.name] = "";
            return acc;
         }, {} as Record<string, any>);
      }

      // CASE B: fields is an object whose values should be arrays
      return Object.entries(fields).reduce((acc, [groupName, groupFields]) => {
         if (Array.isArray(groupFields)) {
            acc[groupName] = groupFields.reduce((groupAcc: any, field: any) => {
               groupAcc[field.name] = "";
               return groupAcc;
            }, {});
         } else {
            acc[groupName] = {};
         }
         return acc;
      }, {} as Record<string, any>);
   }, [formateFields])

   const form = useForm({
      defaultValues
   });

   const handleClose = () => {
      onClose();
      setActiveForm(null);
      setEditingKey(null);
      setEditedValue("");
      setEditOptions({});
      setEditingDocumentId(null);
      setEditingTableName(null);
      setSelectedFn(null);
   };

   const toggleSection = (sectionName: string) => {
      setExpandedSections(prev => ({
         ...prev,
         [sectionName]: !prev[sectionName]
      }));
   };
   const handleAddRow = async (tableName: string) => {
      // Check CREATE permission before allowing add row
      if (!checkPermission(`CREATE:${tableName.toUpperCase()}`)) {
         toast({
            title: "Permission Denied",
            description: "You do not have permission to add rows to this form",
            variant: "destructive",
         });
         return;
      }
      const formData = form.getValues()[tableName];
      const obj = {
         parentId: modalData.table?.data?._id,
         parentTable: modalData.table?.label,
         childTable: tableName,
      }
      const dataToAdd = {
         ...obj,
         fields: {
            ...formData
         }
      }
      const { error } = await addChildToParent({
         variables: {
            input: {
               ...dataToAdd,
            }
         },
      });

      //  if (error) {
      //     const message = (error.graphQLErrors as Array<{ message: string }>).map((e) => e.message).join(", ");
      //     toast({
      //        title: 'Error',
      //        description: message || "Something went wrong",
      //        variant: "destructive"
      //     });
      //     return;
      //  }

      const resetData = {
         ...form.getValues(),
         [tableName]: formateFields.fields[tableName].reduce((acc: any, field: any) => {
            acc[field.name] = "";
            return acc;
         }, {})
      };
      form.reset(resetData);
      setActiveForm(null);
      toast({
         variant: "default",
         title: "Child data submitted Successfully!",
      });
   };

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

   const handleSubmitClick = () => {
      if (!selectedFn) return;
      if (selectedFn.isUserIntervation) {
         onOpen("functionParameters", {
            id: selectedFn.id,
            selectedFnName: selectedFn.functionName,
            selectedData: [modalData?.table?.data],
            selectedFormNameIds: [modalData?.table?.data?._id],
            formName: modalData?.table?.label,
            formNameIds: [modalData?.table?.data?._id],
            unselectedFormNameIds: [],
         });
      } else {
         handleFunctionCall(selectedFn, { ids: [modalData?.table?.data?._id] });
         setPopoverOpen(false);
      }
   };

   // const handleUpdateRow = (tableName: string, rowIndex: number, newData: any) => {
   //    setTableData((prev: any) => ({
   //       ...prev,
   //       [tableName]: prev[tableName].map((row: any, index: number) =>
   //          index === rowIndex ? { ...row, ...newData } : row
   //       )
   //    }));
   // };
   const handlePopoverChange = (open: boolean) => {
      setPopoverOpen(open)
      // Functions are now automatically fetched via useQuery when modal opens
   }

   const handleShowHistory = (documentId: string, tableName: string, formName: string) => {
      onOpen("editHistory", {
         documentId,
         tableName,
         formName
      });
   }

   if (!modalData?.table) {
      return null;
   }

   const isModalOpen = isOpen && type === "childDetails:table";



   return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
         <DialogContent className="text-black max-w-[95vw] sm:max-w-[90vw] md:max-w-[75vw] w-full">
            <DialogHeader className="pt-4 sm:pt-6">
               <DialogTitle className="text-xl sm:text-2xl font-bold">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                           <Badge variant="outline" className="text-xs text-gray-600 font-medium w-fit">
                              ID: {modalData.table?.data?._id}
                           </Badge>
                           <h2 className="capitalize text-lg sm:text-xl">{modalData?.table?.label} Details</h2>
                        </div>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleShowHistory(
                              modalData.table?.data?._id,
                              modalData.table?.label,
                              modalData.table?.label
                           )}
                           className="flex items-center gap-2 w-full sm:w-auto"
                        >
                           <History className="h-4 w-4" />
                           History
                        </Button>
                     </div>
                     <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                        <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
                           <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full sm:w-[200px] justify-between">
                                 <span className="truncate">{selectedFn ? selectedFn.functionName : 'Select function...'}</span>
                                 <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-[90vw] sm:w-[220px] p-0">
                              <div className="p-2 border-b flex justify-end">
                                 <Button size="sm" onClick={handleSubmitClick} disabled={!selectedFn}>
                                    Submit
                                 </Button>
                              </div>
                              <Command>
                                 <CommandInput placeholder="Search function…" />
                                 <CommandList>
                                    <CommandEmpty>No function found.</CommandEmpty>
                                    {companyFunctions.length === 0 && (
                                       <div className="p-2 text-sm text-gray-500">
                                          No functions available for this form
                                       </div>
                                    )}
                                    <CommandGroup>
                                       {companyFunctions.map((item: any) => (
                                          <CommandItem
                                             key={item.functionName}
                                             value={item.functionName}
                                             onSelect={() => setSelectedFn(item)}
                                             className="flex items-center gap-2"
                                          >
                                             <div
                                                className={cn(
                                                   "h-4 w-4 border rounded-sm flex items-center justify-center",
                                                   selectedFn?.functionName === item.functionName
                                                     ? "bg-primary text-white"
                                                     : "bg-transparent"
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
                        <div className='flex flex-wrap gap-2 sm:gap-3'>
                           {individualButtonFunctions.map((fn: any) => (
                              <Button
                                 key={fn.id}
                                 variant="default"
                                 size="sm"
                                 className="items-center gap-1 flex-1 sm:flex-initial"
                                 onClick={() => {
                                    // Check if function requires user intervention (parameters)
                                    if (fn.isUserIntervation) {
                                       onOpen("functionParameters", {
                                          id: fn.id,
                                          selectedFnName: fn.functionName,
                                          selectedData: [modalData?.table?.data],
                                          selectedFormNameIds: [modalData?.table?.data?._id],
                                          formName: modalData?.table?.label,
                                          formNameIds: [modalData?.table?.data?._id],
                                          unselectedFormNameIds: [],
                                       });
                                    } else {
                                       handleFunctionCall(fn, {
                                          ids: [modalData?.table?.data?._id],
                                          unselectedIds: []
                                       });
                                    }
                                 }}
                              >
                                 <span className="truncate">{fn.functionName}</span>
                              </Button>
                           ))}
                        </div>
                     </div>

                  </div>
               </DialogTitle>
               <Separator className="my-4" />
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] sm:max-h-[80vh] w-full rounded-md border">
               <div className="p-2 sm:p-4 space-y-4">
                  <Card className="overflow-hidden">
                     <div className="p-3 sm:p-4 bg-gray-50">
                        <h3 className="font-medium text-base sm:text-lg">Main Details</h3>
                     </div>

                     <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                           {Object.entries(mainData || {})
                              .filter(([key]) => key !== "children" && key !== "_id")
                              .map(([key, value]) => (
                                 <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 border rounded gap-2">
                                    <span className="font-medium capitalize text-sm sm:text-base">{key}:</span>
                                    <div className="flex gap-2 sm:gap-5 items-center flex-1 sm:flex-initial justify-end sm:justify-start">
                                       {editingKey === key ? (
                                          <>
                                             {Array.isArray(editOptions) && editOptions.length > 0 ? (
                                                <select
                                                   className="border px-2 py-1 rounded text-sm flex-1 sm:flex-initial min-w-0"
                                                   value={editedValue}
                                                   onChange={(e) => setEditedValue(e.target.value)}
                                                >
                                                   <option value="" disabled>Select {key}</option>
                                                   {editOptions.map((option: any) => (
                                                      <option key={option.value} value={option.value}>
                                                         {option.label}
                                                      </option>
                                                   ))}
                                                </select>
                                             ) : (
                                                <input
                                                   type="text"
                                                   className="border px-2 py-1 rounded text-sm flex-1 sm:flex-initial min-w-0"
                                                   value={editedValue}
                                                   onChange={(e) => setEditedValue(e.target.value)}
                                                />
                                             )}
                                             <button
                                                onClick={() => handleSave(key)}
                                                className="text-green-600 font-semibold text-sm whitespace-nowrap"
                                             >
                                                Save
                                             </button>
                                             <button
                                                onClick={() => {
                                                   setEditingKey(null);
                                                   setEditOptions([]);
                                                }}
                                                className="text-gray-500 text-sm whitespace-nowrap"
                                             >
                                                Cancel
                                             </button>
                                          </>
                                       ) : (
                                          <>
                                             <span className="text-sm sm:text-base truncate flex-1 sm:flex-initial">{value as string}</span>
                                             {checkPermission(`UPDATE:${(modalData?.table?.label || '').toUpperCase()}`) && (
                                                <Pen
                                                   size={18}
                                                   className="cursor-pointer shrink-0"
                                                   onClick={() => handleEditClick(key, value as string, modalData?.table?.data?._id, modalData?.table?.label)}
                                                />
                                             )}
                                          </>
                                       )}
                                    </div>
                                 </div>
                              ))}


                        </div>
                     </CardContent>
                  </Card>

                  {/* Child Tables */}
                  {childTables.map(([formName, fields]: any) => {
                     const rows = childRows[formName] || [];
                     return (
                        <Card key={formName} className="overflow-hidden">
                           <div
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 cursor-pointer bg-gray-50 gap-3 sm:gap-0"
                              onClick={() => toggleSection(formName)}
                           >
                              <div className="flex items-center space-x-2">
                                 {expandedSections[formName] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                 <h3 className="font-medium text-base sm:text-lg capitalize">{formName}</h3>
                                 <Badge variant="secondary" className="ml-2">
                                    {(tableData[formName] || []).length}
                                 </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleShowHistory(
                                          modalData.table?.data?._id,
                                          formName,
                                          formName
                                       );
                                    }}
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                 >
                                    <History className="h-4 w-4" />
                                    <span className="hidden sm:inline">Table History</span>
                                    <span className="sm:hidden">History</span>
                                 </Button>
                                 {checkPermission(`CREATE:${formName.toUpperCase()}`) && (
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveForm(activeForm === formName ? null : formName);
                                       }}
                                       className="w-full sm:w-auto"
                                    >
                                       <Plus className="h-4 w-4 sm:mr-2" />
                                       <span className="hidden sm:inline">Add Row</span>
                                       <span className="sm:hidden">Add</span>
                                    </Button>
                                 )}
                              </div>
                           </div>

                           {expandedSections[formName] && (
                              <CardContent className="pt-4">
                                 {(rows.length || 0) > 0 ? (
                                    <div className="overflow-x-auto">
                                       <Table>
                                          <TableHeader>
                                             <TableRow>
                                                {fields.map((field: any) => (
                                                   <TableHead className='font-bold whitespace-nowrap' key={field.name}>{field.name}</TableHead>
                                                ))}
                                                <TableHead className='font-bold whitespace-nowrap'>Actions</TableHead>
                                             </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                             {rows.map((row, idx) => (
                                                <TableRow key={row._id?.$oid ?? idx}>
                                                   {fields.map((f: { name: React.Key | null | undefined; }) => (
                                                      //@ts-ignore
                                                      // <TableCell key={f.name}>{row[f.name]}</TableCell>
                                                      <TableCell key={f.name} className="min-w-[150px]">
                                                         <div className="flex gap-2 sm:gap-5 items-center">
                                                            {editingKey === f.name ? (
                                                               <>
                                                                  {Array.isArray(editOptions) && editOptions.length > 0 ? (
                                                                     <select
                                                                        className="border px-2 py-1 rounded text-sm flex-1 min-w-0"
                                                                        value={editedValue}
                                                                        onChange={(e) => setEditedValue(e.target.value)}
                                                                     >
                                                                        <option value="" disabled>Select {f.name}</option>
                                                                        {editOptions.map((option: any) => (
                                                                           <option key={option.value} value={option.value}>
                                                                              {option.label}
                                                                           </option>
                                                                        ))}
                                                                     </select>
                                                                  ) : (
                                                                     <input
                                                                        type="text"
                                                                        className="border px-2 py-1 rounded text-sm flex-1 min-w-0"
                                                                        value={editedValue}
                                                                        onChange={(e) => setEditedValue(e.target.value)}
                                                                     />
                                                                  )}
                                                                  <button
                                                                     onClick={() => handleSave(f.name as string)}
                                                                     className="text-green-600 font-semibold text-sm whitespace-nowrap shrink-0"
                                                                  >
                                                                     Save
                                                                  </button>
                                                                  <button
                                                                     onClick={() => {
                                                                        setEditingKey(null);
                                                                        setEditOptions([]);
                                                                     }}
                                                                     className="text-gray-500 text-sm whitespace-nowrap shrink-0"
                                                                  >
                                                                     Cancel
                                                                  </button>
                                                               </>
                                                            ) : (
                                                               <>
                                                                  <span className="text-sm sm:text-base truncate flex-1">{f.name ? row[f.name as string] : ''}</span>
                                                                  {checkPermission(`UPDATE:${(formName || '').toUpperCase()}`) && (
                                                                     <Pen
                                                                        size={18}
                                                                        className="cursor-pointer shrink-0"
                                                                        onClick={() => f.name && handleEditClick(f.name as string, f.name ? row[f.name as string] : '', row._id?.$oid || row._id, formName)}
                                                                     />
                                                                  )}
                                                               </>
                                                            )}
                                                         </div>
                                                      </TableCell>
                                                   ))}
                                                   <TableCell className="whitespace-nowrap">
                                                      <Button
                                                         variant="outline"
                                                         size="sm"
                                                         onClick={() => handleShowHistory(
                                                            row._id?.$oid || row._id,
                                                            formName,
                                                            formName
                                                         )}
                                                         className="flex items-center gap-1"
                                                      >
                                                         <History className="h-3 w-3" />
                                                         <span className="hidden sm:inline">History</span>
                                                      </Button>
                                                   </TableCell>
                                                </TableRow>
                                             ))}
                                          </TableBody>
                                       </Table>
                                    </div>
                                 ) : (
                                    <div className="text-center py-4 text-gray-500">
                                       No data available
                                    </div>
                                 )}

                                 {activeForm === formName && (
                                    <div className="mt-4 border rounded-lg p-3 sm:p-4 relative">
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-2 top-2"
                                          onClick={() => setActiveForm(null)}
                                       >
                                          <X className="h-4 w-4" />
                                       </Button>
                                       <Form {...form}>
                                          <form className="space-y-3 sm:space-y-4">
                                             {fields.map((field: any) => (
                                                <FormField
                                                   key={field.name}
                                                   control={form.control}
                                                   name={`${formName}.${field.name}`}
                                                   render={({ field: formField }) => (
                                                      <FormItem>
                                                         <FormLabel className="text-sm sm:text-base">{field.name}</FormLabel>
                                                         <FormControl>
                                                            <Input
                                                               {...formField}
                                                               placeholder={field.name}
                                                               required={field.isRequired}
                                                               className="text-sm sm:text-base"
                                                            />
                                                         </FormControl>
                                                      </FormItem>
                                                   )}
                                                />
                                             ))}
                                             <Button
                                                onClick={() => handleAddRow(formName)}
                                                className="w-full"
                                             >
                                                Submit
                                             </Button>
                                          </form>
                                       </Form>
                                    </div>
                                 )}
                              </CardContent>
                           )}
                        </Card>
                     )
                  }
                  )}
               </div>
            </ScrollArea>
         </DialogContent>
      </Dialog>
   );
};