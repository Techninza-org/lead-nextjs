"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import MultipleSelector from "@/components/multi-select-shadcn-expension"
import type { Option } from "@/components/multi-select-shadcn-expension"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PencilIcon } from "lucide-react"
import { useMutation } from "graphql-hooks"
import { companyMutation } from "@/lib/graphql/company/mutation"
import { useToast } from "@/components/ui/use-toast"

// Sample categories data
const distinctCategories = {
  categories: ["C1", "C2", "C3"],
  subCategories: ["S1", "S2", "S3"],
  subCategories2: ["S2-1", "S2-2", "S2-3"],
  subCategories3: ["S3-1", "S3-2", "S3-3"],
  subCategories4: ["S4-1", "S4-2"]
}

const categorySchema = z.object({
  category: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).min(1, "Category is required"),
  subCategory: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  subCategory2: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  subCategory3: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  subCategory4: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
})

interface CategoryModalProps {
  companyId: string
  initialData: {
    category?: string
    subCategory?: string
    subCategory2?: string
    subCategory3?: string
    subCategory4?: string
  }
  onSuccess?: () => void
}

export function CategoryModal({ companyId, initialData, onSuccess }: CategoryModalProps) {
  const [open, setOpen] = React.useState(false)
  const [UpdateCompanyCategories] = useMutation(companyMutation.UPDATE_COMPANY_CATEGORIES);
  const { toast } = useToast()

  // Prepare options for MultipleSelector
  const mappedCategories: Option[] = distinctCategories.categories.map(cat => ({
    label: cat,
    value: cat
  }))

  const mappedSubCategories: Option[] = distinctCategories.subCategories.map(subCat => ({
    label: subCat,
    value: subCat
  }))

  const mappedSubCategories2: Option[] = distinctCategories.subCategories2.map(subCat2 => ({
    label: subCat2,
    value: subCat2
  }))

  const mappedSubCategories3: Option[] = distinctCategories.subCategories3.map(subCat3 => ({
    label: subCat3,
    value: subCat3
  }))

  const mappedSubCategories4: Option[] = distinctCategories.subCategories4.map(subCat4 => ({
    label: subCat4,
    value: subCat4
  }))

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category: initialData?.category
        ? [{ label: initialData.category, value: initialData.category }]
        : [],
      subCategory: initialData?.subCategory
        ? [{ label: initialData.subCategory, value: initialData.subCategory }]
        : [],
      subCategory2: initialData?.subCategory2
        ? [{ label: initialData.subCategory2, value: initialData.subCategory2 }]
        : [],
      subCategory3: initialData?.subCategory3
        ? [{ label: initialData.subCategory3, value: initialData.subCategory3 }]
        : [],
      subCategory4: initialData?.subCategory4
        ? [{ label: initialData.subCategory4, value: initialData.subCategory4 }]
        : [],
    },
  })

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    try {
      const { data: formRes, error } = await UpdateCompanyCategories({
        variables: {
          companyId: companyId,
          category: values.category[0]?.value,
          subCategory: values.subCategory?.[0]?.value,
          subCategory2: values.subCategory2?.[0]?.value,
          subCategory3: values.subCategory3?.[0]?.value,
          subCategory4: values.subCategory4?.[0]?.value,
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
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: "Failed to update categories",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Categories</DialogTitle>
          <DialogDescription>
            Update the categories for this company
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                      badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                      options={mappedCategories}
                      placeholder="Select Category"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No categories found.
                        </p>
                      }
                      maxSelected={1}
                      hidePlaceholderWhenSelected
                      triggerSearchOnFocus
                      creatable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                      badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                      options={mappedSubCategories}
                      placeholder="Select Sub Category"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No sub-categories found.
                        </p>
                      }
                      maxSelected={1}
                      hidePlaceholderWhenSelected
                      triggerSearchOnFocus
                      creatable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subCategory2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category 2</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                      badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                      options={mappedSubCategories2}
                      placeholder="Select Sub Category 2"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No sub-categories found.
                        </p>
                      }
                      maxSelected={1}
                      hidePlaceholderWhenSelected
                      triggerSearchOnFocus
                      creatable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subCategory3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category 3</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                      badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                      options={mappedSubCategories3}
                      placeholder="Select Sub Category 3"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No sub-categories found.
                        </p>
                      }
                      maxSelected={1}
                      hidePlaceholderWhenSelected
                      triggerSearchOnFocus
                      creatable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subCategory4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category 4</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                      badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                      options={mappedSubCategories4}
                      placeholder="Select Sub Category 4"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No sub-categories found.
                        </p>
                      }
                      maxSelected={1}
                      hidePlaceholderWhenSelected
                      triggerSearchOnFocus
                      creatable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}