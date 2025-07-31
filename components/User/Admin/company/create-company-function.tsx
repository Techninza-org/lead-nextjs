'use client'
import React from 'react'
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { companyMutation } from '@/lib/graphql/company/mutation';
import { useMutation, useQuery } from 'graphql-hooks';
import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useModal } from '@/hooks/use-modal-store';
import MultipleSelector from '@/components/multi-select-shadcn-expension';
import { adminQueries } from '@/lib/graphql/admin/queries';
import DynamicFunctionParametersModal, { ParsedData } from '@/components/dynamic/dynamic-funciton-parameters-modal';

const FunctionFormSchema = z.object({
  orgId: z.string().min(1, "Org ID is required"),
  functionName: z.string().min(1, "Function Name is required"),
  functionType: z.enum(["INDIVIDUAL", "BULK", "BOTH"]),
  desc: z.string().min(1, "Description is required"),
  viewName: z.string().min(1, "View/Table Name is required"),
  tags: z.array(z.string()),
  isUserIntervation: z.boolean(),
  isValid: z.boolean().default(true),
  returnType: z.enum([
    "only_backend_updation",
    "backend_updation_with_frontend_response",
    "backend_updation_with_frontend_response_and_updation",
    "binary_file"
  ]),
  companyId: z.string(),
  variables: z.array(z.string()).default([]),
  individualButton: z.boolean().default(false),
  parameters: z.array(z.object({
    fieldType: z.string(),
    order: z.number(),
    isRequired: z.boolean(),
    isDisabled: z.boolean(),
    isRelation: z.boolean(),
    options: z.array(z.string()).optional(),
    name: z.string().optional(),
    ddOptionId: z.string().optional(),
    optionId: z.string().optional(),
    isHardCoded: z.boolean().optional(),
    relationFormId: z.string().optional(),
    relationFormName: z.string().optional(),
    relationFormFieldName: z.string().optional(),
  })).default([]),
});

export default function CreateCompanyFunction({ id }: { id: string }) {
  const [companyForms, setCompanyForms] = useState([])
  const [modalFields, setModalFields] = useState<ParsedData[]>([])
  const { toast } = useToast()
  const { onOpen, onClose, type } = useModal()
  const isModalOpen = type === "DynamicFunctionParametersModal"

  const [createFunc] = useMutation(companyMutation.CREATE_COMPANY_FUNCTION);

  const { } = useQuery(adminQueries.getCompanyForms, {
    skip: !id,
    variables: {
      companyId: id
    },
    onSuccess: ({ data }: { data: any }) => {
      console.log(data, "data")
      setCompanyForms(data?.getCompanyForms)
    },
  })

  const form = useForm({
    resolver: zodResolver(FunctionFormSchema),
    defaultValues: {
      orgId: id,
      functionName: "",
      functionType: "INDIVIDUAL",
      desc: "",
      viewName: "",
      tags: [],
      isUserIntervation: false,
      isValid: true,
      returnType: "only_backend_updation",
      companyId: id,
      variables: [],
      individualButton: false,
      parameters: [],
    },
  })

  const watchIntervention = form.watch("isUserIntervation")

  const onSubmit = async (values: any) => {
    console.log("Form submitted with values:", values);
    console.log("Modal fields:", modalFields);
    

    try {
      const { data, error } = await createFunc({
        variables: {
          orgId: values.orgId,
          functionName: values.functionName,
          functionType: values.functionType,
          desc: values.desc,
          viewName: values.viewName,
          tags: values.tags,
          isUserIntervation: values.isUserIntervation,
          isValid: values.isValid,
          returnType: values.returnType,
          companyId: values.companyId,
          variables: values.variables || [],
          individualButton: values.individualButton || false,
          parameters: modalFields.map((field) => ({
            fieldType: field.fieldType,
            order: field.order,
            isRequired: field.isRequired,
            isDisabled: field.isDisabled,
            isRelation: field.isRelation,
            options: field.options || [],
            name: field.name,
            ddOptionId: field.ddOptionId,
            optionId: field.optionId,
            isHardCoded: field.isHardCoded || false,
            // relationFormId: '6863b55131dd5ae49fbbd852',
            // relationFormName: 'Leads',
            // relationFormFieldName: 'name',
          }))
        },
      });
      console.log("Response data:", data);

      if (error) {
        const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
        toast({
          title: 'Error',
          description: message || "Something went wrong",
          variant: "destructive"
        });
        return;
      }

      toast({
        variant: "default",
        title: "Company Function Created Successfully!",
      });
    } catch (error) {
      console.error("Error during submission:", error);
      toast({
        title: 'Error',
        description: "Failed to submit function.",
        variant: "destructive"
      });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Function for {id}</h1>
      <Form {...form}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Function Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <FormField control={form.control} name="functionName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Function Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Function Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="functionType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Function Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Function Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                          <SelectItem value="BULK">BULK</SelectItem>
                          <SelectItem value="BOTH">BOTH</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="viewName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>View/Table Name</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a View/Table" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companyForms.map((item: any) => (
                            <SelectItem key={item.id} value={item.name}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="returnType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Return Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="only_backend_updation">Only Backend Updation</SelectItem>
                          <SelectItem value="backend_updation_with_frontend_response">Backend Updation with Frontend Response</SelectItem>
                          <SelectItem value="backend_updation_with_frontend_response_and_updation">Backend Updation with Frontend Response and Updation</SelectItem>
                          <SelectItem value="binary_file">Binary File</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="mt-6">
                <FormField control={form.control} name="desc" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className='mt-6'>
                <FilterableList
                  form={form}
                  name="tags"
                  value={form.watch("tags")}
                  placeholder="Select or create tags..."
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FormField control={form.control} name="individualButton" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Individual Button?</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isValid" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Is Valid?</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isUserIntervation" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">With Parameters?</FormLabel>
                  </FormItem>
                )} />
              </div>
              {watchIntervention && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpen("DynamicFunctionParametersModal")}
                  className="mt-4"
                >
                  Add Parameters
                </Button>
              )}

              <div className="flex justify-end mt-8">
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <DynamicFunctionParametersModal
          isOpen={isModalOpen}
          initialValues={modalFields}
          onSave={(fields: React.SetStateAction<{ fieldType: string; order: number; isRequired: boolean; isDisabled: boolean; isRelation: boolean; options?: any; name?: string | undefined; ddOptionId?: any; optionId?: string | undefined; isHardCoded?: boolean | undefined; }[]>) => {
            setModalFields(fields)
            onClose()
          }}
          onCancel={() => onClose()}
        />
      </Form>
    </div>
  )
}


function FilterableList({
  form,
  name,
  value,
  placeholder = "Select tags...",
}: {
  form: any;
  name: string;
  value?: any;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">
            {name}
          </FormLabel>
          <FormControl>
            <MultipleSelector
              value={(field.value || []).map((v: string) => ({ label: v, value: v }))}
              onChange={(selected: any[]) => {
                form.setValue(name, selected.map((s) => s.value));
              }}
              creatable
              hidePlaceholderWhenSelected
              options={[]}
              badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
              triggerSearchOnFocus
              placeholder={placeholder}
              emptyIndicator={
                <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                  no tags found.
                </p>
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
