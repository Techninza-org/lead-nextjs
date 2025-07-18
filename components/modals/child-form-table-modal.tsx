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
   X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { updateDependentFields } from '@/lib/utils';
import { useCompany } from '../providers/CompanyProvider';
import { useMutation, useQuery } from 'graphql-hooks';
import { companyQueries } from '@/lib/graphql/company/queries';
import { useToast } from '../ui/use-toast';
import { DeptMutation } from '@/lib/graphql/dept/mutation';
export const ChildDetailsModal = () => {
   const { isOpen, onClose, type, data: modalData } = useModal();
   const { companyDeptFields } = useCompany()
   const { toast } = useToast();

   const [tableData, setTableData] = useState<Record<string, any[]>>({});
   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
   const [activeForm, setActiveForm] = useState<string | null>(null);
   const [childRows, setChildRows] = useState<Record<string, any[]>>({});
   const [addChildToParent] = useMutation(DeptMutation.ADD_CHILD_TO_PARENT)

   useEffect(() => {
      if (modalData?.table?.data?.children) {
         setTableData(prevData => ({
            ...prevData,
            ...modalData.table.data.children
         }));
      }
   }, [modalData?.table?.data?.children]);

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
      // “just in case” — if someone stuck in a non‐array, skip it
      acc[groupName] = {};
    }
    return acc;
  }, {} as Record<string, any>);
}, [formateFields])

   // const defaultValues = useMemo(() =>
   //    Object.keys(formateFields?.fields || {}).reduce((acc: any, key) => {
   //       acc[key] = formateFields.fields[key].reduce((fieldAcc: any, field: any) => {
   //          fieldAcc[field.name] = "";
   //          return fieldAcc;
   //       }, {});
   //       return acc;
   //    }, {}),
   //    [formateFields]);

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

   // const handleUpdateRow = (tableName: string, rowIndex: number, newData: any) => {
   //    setTableData((prev: any) => ({
   //       ...prev,
   //       [tableName]: prev[tableName].map((row: any, index: number) =>
   //          index === rowIndex ? { ...row, ...newData } : row
   //       )
   //    }));
   // };

   if (!modalData?.table) return null;

   const isModalOpen = isOpen && type === "childDetails:table";

   

   return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
         <DialogContent className="text-black max-w-[98vw] h-[98vh]">
            <DialogHeader className="pt-6">
               <DialogTitle className="text-2xl font-bold">
                  <div className="flex items-center justify-between">
                     <div>
                        <Badge variant="outline" className="text-xs text-gray-600 font-medium">
                           ID: {modalData.table?.data?._id}
                        </Badge>
                        <h2 className="pl-2 capitalize">{modalData?.table?.label} Details</h2>
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
                           {Object.entries(modalData.table?.data || {})
                              .filter(([key]) => key !== "children" && key !== "_id")
                              .map(([key, value]) => (
                                 <div key={key} className="flex justify-between items-center p-2 border rounded">
                                    <span className="font-medium capitalize">{key}:</span>
                                    <span>{value as string}</span>
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
                  <TableCell key={f.name}>{row[f.name]}</TableCell>
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
                     )}
                  )}
               </div>
            </ScrollArea>
         </DialogContent>
      </Dialog>
   );
};