"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast"
import { useModal } from "@/hooks/use-modal-store"
import { useAtomValue } from "jotai"
import { userAtom } from "@/lib/atom/userAtom"
import { Input } from "../ui/input"
import { useMutation, useQuery } from "graphql-hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { deptQueries } from "@/lib/graphql/dept/queries"
import { LOGIN_USER } from "@/lib/graphql/user/mutations"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import React, { useEffect, useState } from "react"
import FilterableList from "./create-dept-form-modal"
import { companyMutation } from "@/lib/graphql/company/mutation"

const creatDeptFormSchema = z.object({
  formName: z.string(),
  deptId: z.string(),
  categoryName: z.string().optional(),
});

export const EditDeptFormModal = () => {
  const [categoryValue, setCategoryValue] = useState<string>()
  const userInfo = useAtomValue(userAtom)

  const { isOpen, onClose, type, data: modalData } = useModal();
  const { form: formData } = modalData

  const [UpdateDeptFormNames, { loading: assignLoading }] = useMutation(companyMutation.UPDATE_DEPT_FORM_NAMES)

  const { loading: deptLoading, error: deptError, data: deptData } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
    variables: { companyId: userInfo?.companyId },
    skip: !userInfo?.token || !userInfo?.companyId,
    refetchAfterMutations: [{ mutation: LOGIN_USER }],
  });

  const isModalOpen = isOpen && type === "editDeptForm";
  const { toast } = useToast()

  const form = useForm<z.infer<typeof creatDeptFormSchema>>({
    resolver: zodResolver(creatDeptFormSchema),
    defaultValues: {
      deptId: "",
      formName: "",
      categoryName: ""
    }
  })

  useEffect(() => {
    if (formData && isModalOpen && deptData) {
      const dept = deptData?.getCompanyDepts?.find((dept: any) =>
        dept.companyForms?.some((form: any) => form.id === formData.id)
      );

      if (dept) {
        form.reset({
          deptId: dept.id,
          formName: formData.name,
          categoryName: formData.category?.name || ""
        });
        setCategoryValue(formData.category?.name || "");
      }
    }
  }, [formData, isModalOpen, deptData, form]);

  const formDeptId = form.watch("deptId")
  const selectedDept = deptData?.getCompanyDepts?.find((x: any) => x.id === formDeptId)

  const onSubmit = async (data: z.infer<typeof creatDeptFormSchema>) => {
    const { data: formRes, error } = await UpdateDeptFormNames({
      variables: {
        companyDeptFormId: formData?.id, // Required to identify the form to update
        categoryName: data.categoryName,
        formName: data.formName,
      }
    })

    if (error) {
      const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ")
      toast({
        title: 'Error',
        description: message || "Something went wrong",
        variant: "destructive"
      })
      return;
    }

    toast({
      variant: "default",
      title: "Form Updated Successfully!",
    })
    handleClose();
  }

  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="text-black max-w-screen-md">
        <DialogHeader className="pt-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Edit Form
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="deptId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0">
                      {deptData?.getCompanyDepts?.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id} className="capitalize">{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FilterableList
              form={form}
              selectedDept={selectedDept}
              value={[{ label: categoryValue, value: categoryValue }]}
            />

            <FormField
              control={form.control}
              name="formName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">Form Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the form name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-6">Update</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}