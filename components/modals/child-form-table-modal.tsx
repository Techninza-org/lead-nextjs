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
   Pen
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

export const ChildDetailsModal = () => {
   const { isOpen, onClose, type, data: modalData } = useModal();
   const { companyDeptFields } = useCompany()
   const { toast } = useToast();
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

   const [addChildToParent] = useMutation(DeptMutation.ADD_CHILD_TO_PARENT)
   const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE);

   // Query to get edit options
   const { data: optionsData, refetch: refetchOptions } = useQuery(deptQueries.GET_OPTIONS, {
      variables: { key: editingKey, formName: modalData?.table?.label },
      pause: !editingKey, // Only run when editingKey is set
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

   useEffect(() => {
      fetchCompanyFunctions();
   }, [isOpen])

   const handleEditClick = (key: string, value: string) => {
      setEditingKey(key);
      setEditedValue(value);
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
               formName: modalData?.table?.label,
               docId: modalData?.table?.data?._id,
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
   const formateFields: any = useMemo(() => formateForms?.find((x: any) => x.name === modalData?.table?.label) || [], [formateForms, modalData?.table?.label])

   const childTables = Object
      .entries(formateFields.fields || {})
      .filter(([key, def]) =>
         key !== modalData.table?.label
         && Array.isArray(def)
         && def.length > 0
      ) as [string, any[]][];
   console.log(childTables, "Child Tables Data")

   const parentId = modalData?.table?.data?._id;
   console.log(parentId, "Parent ID");

   const childTableNames = childTables.map(([name]) => name);
   console.log(childTableNames, "Child Table Names");

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

   const fetchCompanyFunctions = async () => {
      // Use your GraphQL client directly or useQuery with manual trigger
      const { data } = await funcs.refetch(); // You'll need to move useQuery into this scope
      if (data?.getCompnayFunctionsAdmin) {
         const filteredFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === modalData?.table?.label && fn.functionType !== "BULK" && fn.individualButton === false) || [];
         setCompanyFunctions(filteredFunctions);
         const individualButtonFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === modalData?.table?.label && fn.functionType !== "BULK" && fn.individualButton === true);
         setIndividualButtonFunctions(individualButtonFunctions);
         console.log(1111111111111);

      }
   };

   // useQuery here but SKIP by default
   const funcs = useQuery(adminQueries.getCompnayFunctions, {
      variables: {
         orgId: 'ORG_GEAR' // Replace with actual org ID or use context
      }, skip: true, onSuccess: ({ data }: { data: any }) => {
         const filteredFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === modalData?.table?.label && fn.functionType !== "BULK" && fn.individualButton === false) || [];
         setCompanyFunctions(filteredFunctions);
         const individualButtonFunctions = data?.getCompnayFunctionsAdmin?.filter((fn: any) => fn.viewName === modalData?.table?.label && fn.functionType !== "BULK" && fn.individualButton === true);
         setIndividualButtonFunctions(individualButtonFunctions);
         console.log(2222222222222222);

      }
   })

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
   };

   const toggleSection = (sectionName: string) => {
      setExpandedSections(prev => ({
         ...prev,
         [sectionName]: !prev[sectionName]
      }));
   };
   const handleAddRow = async (tableName: string) => {
      const formData = form.getValues()[tableName];
      console.log(formData, "Form Data to Add Row");
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
      console.log(dataToAdd, "Data to be added to child table");
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
      // // if (open) fetchCompanyFunctions()
      // else {
      //   setCompanyFunctions([])
      //   setSelectedFn(null)
      // }
   }

   if (!modalData?.table) return null;

   const isModalOpen = isOpen && type === "childDetails:table";



   return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
         <DialogContent className="text-black max-w-[75vw]">
            <DialogHeader className="pt-6">
               <DialogTitle className="text-2xl font-bold">
                  <div className="flex items-center justify-between">
                     <div>
                        <Badge variant="outline" className="text-xs text-gray-600 font-medium">
                           ID: {modalData.table?.data?._id}
                        </Badge>
                        <h2 className="pl-2 capitalize">{modalData?.table?.label} Details</h2>
                     </div>
                     <div className='flex gap-3'>
                        <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
                           <PopoverTrigger asChild>
                              <Button variant="outline" className="w-[200px] justify-between">
                                 {/* {selectedFn ? selectedFn.functionName : 'Select function...'} */}
                                 Select Function...
                                 <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-[220px] p-0">
                              <div className="p-2 border-b flex justify-end">
                                 {/* onClick={()=>handleFunctionCall(selectedFn, { ids:[parentId], unselectedIds: [] })} */}
                                 <Button size="sm">
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
                                             //  onSelect={onSelectFunction}
                                             className="cursor-pointer flex items-center gap-2"
                                          >
                                             <div
                                                className={cn(
                                                   "h-4 w-4 border rounded-sm flex items-center justify-center transition",
                                                   //   selectedFn?.functionName === item.functionName ? "bg-primary text-white" : "bg-transparent"
                                                )}
                                             >
                                                {/* {selectedFn?.functionName === item.functionName && (
                          <CheckIcon className="w-3 h-3" />
                        )} */}
                                             </div>
                                             <span>{item.functionName}</span>
                                          </CommandItem>
                                       ))}
                                    </CommandGroup>
                                 </CommandList>
                              </Command>
                           </PopoverContent>
                        </Popover>
                        <div className='flex gap-3'>
                           {individualButtonFunctions.map((fn: any) => (
                              <Button
                                 key={fn.id}
                                 variant="default"
                                 size="sm"
                                 className="items-center gap-1"
                              // onClick={() => handleFunctionCall(fn, {
                              //   ids: selectedLeads.map(lead => lead._id),
                              //   unselectedIds: unselectedRows
                              // })}
                              >
                                 <span>{fn.functionName}</span>
                              </Button>
                           ))}
                        </div>
                     </div>

                  </div>
               </DialogTitle>
               <Separator className="my-4" />
            </DialogHeader>
            <ScrollArea className="max-h-full w-full rounded-md border">
               <div className="p-4 space-y-4">
                  <Card className="overflow-hidden">
                     <div className="p-4 bg-gray-50">
                        <h3 className="font-medium text-lg">Main Details</h3>
                     </div>

                     <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                           {Object.entries(mainData || {})
                              .filter(([key]) => key !== "children" && key !== "_id")
                              .map(([key, value]) => (
                                 <div key={key} className="flex justify-between items-center p-2 border rounded">
                                    <span className="font-medium capitalize">{key}:</span>
                                    <div className="flex gap-5 items-center">
                                       {editingKey === key ? (
                                          <>
                                             {Array.isArray(editOptions) && editOptions.length > 0 ? (
                                                <select
                                                   className="border px-2 py-1 rounded"
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
                                                   className="border px-2 py-1 rounded"
                                                   value={editedValue}
                                                   onChange={(e) => setEditedValue(e.target.value)}
                                                />
                                             )}
                                             <button
                                                onClick={() => handleSave(key)}
                                                className="text-green-600 font-semibold"
                                             >
                                                Save
                                             </button>
                                             <button
                                                onClick={() => {
                                                   setEditingKey(null);
                                                   setEditOptions([]);
                                                }}
                                                className="text-gray-500"
                                             >
                                                Cancel
                                             </button>
                                          </>
                                       ) : (
                                          <>
                                             <span>{value as string}</span>
                                             <Pen
                                                size={18}
                                                className="cursor-pointer"
                                                onClick={() => handleEditClick(key, value as string)}
                                             />
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
                              className="flex items-center justify-between p-4 cursor-pointer bg-gray-50"
                              onClick={() => toggleSection(formName)}
                           >
                              <div className="flex items-center space-x-2">
                                 {expandedSections[formName] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                 <h3 className="font-medium text-lg capitalize">{formName}</h3>
                                 <Badge variant="secondary" className="ml-2">
                                    {(tableData[formName] || []).length}
                                 </Badge>
                              </div>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveForm(activeForm === formName ? null : formName);
                                 }}
                              >
                                 <Plus className="h-4 w-4 mr-2" />
                                 Add Row
                              </Button>
                           </div>

                           {expandedSections[formName] && (
                              <CardContent className="pt-4">
                                 {(rows.length || 0) > 0 ? (
                                    <Table>
                                       <TableHeader>
                                          <TableRow>
                                             {fields.map((field: any) => (
                                                <TableHead className='font-bold' key={field.name}>{field.name}</TableHead>
                                             ))}
                                             {/* <TableHead>Actions</TableHead> */}
                                          </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                          {rows.map((row, idx) => (
                                             <TableRow key={row._id?.$oid ?? idx}>
                                                {fields.map((f: { name: React.Key | null | undefined; }) => (
                                                   //@ts-ignore
                                                   // <TableCell key={f.name}>{row[f.name]}</TableCell>
                                                   <TableCell key={f.name}>
                                                      <div className="flex gap-5 items-center">
                                                         {editingKey === f.name ? (
                                                            <>
                                                               {Array.isArray(editOptions) && editOptions.length > 0 ? (
                                                                  <select
                                                                     className="border px-2 py-1 rounded"
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
                                                                     className="border px-2 py-1 rounded"
                                                                     value={editedValue}
                                                                     onChange={(e) => setEditedValue(e.target.value)}
                                                                  />
                                                               )}
                                                               <button
                                                                  onClick={() => handleSave(f.name as string)}
                                                                  className="text-green-600 font-semibold"
                                                               >
                                                                  Save
                                                               </button>
                                                               <button
                                                                  onClick={() => {
                                                                     setEditingKey(null);
                                                                     setEditOptions([]);
                                                                  }}
                                                                  className="text-gray-500"
                                                               >
                                                                  Cancel
                                                               </button>
                                                            </>
                                                         ) : (
                                                            <>
                                                               <span>{f.name ? row[f.name as string] : ''}</span>
                                                               <Pen
                                                               size={18}
                                                                  className="cursor-pointer"
                                                                  onClick={() => f.name && handleEditClick(f.name as string, f.name ? row[f.name as string] : '')}
                                                               />
                                                            </>
                                                         )}
                                                      </div>
                                                   </TableCell>
                                                ))}
                                             </TableRow>
                                          ))}
                                       </TableBody>
                                    </Table>
                                 ) : (
                                    <div className="text-center py-4 text-gray-500">
                                       No data available
                                    </div>
                                 )}

                                 {activeForm === formName && (
                                    <div className="mt-4 border rounded-lg p-4 relative">
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-2 top-2"
                                          onClick={() => setActiveForm(null)}
                                       >
                                          <X className="h-4 w-4" />
                                       </Button>
                                       <Form {...form}>
                                          <form className="space-y-4">
                                             {fields.map((field: any) => (
                                                <FormField
                                                   key={field.name}
                                                   control={form.control}
                                                   name={`${formName}.${field.name}`}
                                                   render={({ field: formField }) => (
                                                      <FormItem>
                                                         <FormLabel>{field.name}</FormLabel>
                                                         <FormControl>
                                                            <Input
                                                               {...formField}
                                                               placeholder={field.name}
                                                               required={field.isRequired}
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