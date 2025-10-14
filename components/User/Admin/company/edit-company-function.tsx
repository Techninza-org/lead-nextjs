'use client'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useMutation, useQuery } from 'graphql-hooks'
import { adminQueries } from '@/lib/graphql/admin/queries'
import { companyMutation } from '@/lib/graphql/company/mutation'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import MultipleSelector from '@/components/multi-select-shadcn-expension'

const FunctionFormSchema = z.object({
  orgId: z.string(),
  functionName: z.string(),
  functionType: z.enum(['INDIVIDUAL', 'BULK', 'BOTH']),
  desc: z.string().min(1, 'Description is required'),
  viewName: z.string(),
  tags: z.array(z.string()),
  isUserIntervation: z.boolean(),
  isValid: z.boolean(),
  returnType: z.any(),
  companyId: z.string()
})

function TagsInput({ value = [], onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const newTag = input.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInput("");
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map(tag => (
          <Badge key={tag} className="flex items-center gap-1">
            {tag}
            <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemove(tag)} />
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type tag and press Enter or ,"
      />
      <div className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add tag</div>
    </div>
  );
}

export default function EditCompanyFunction({ id }: { id: string }) {
  const { toast } = useToast()
  const form = useForm({
    resolver: zodResolver(FunctionFormSchema),
    defaultValues: {
      orgId: id,
      functionName: '',
      functionType: 'INDIVIDUAL',
      desc: '',
      viewName: '',
      tags: [],
      isUserIntervation: false,
      isValid: true,
      returnType: 'only_backend_updation',
      companyId: id,
    }
  })

  const { data, error, loading } = useQuery(adminQueries.getCompanyFunctionById, { variables: { id } })

  useEffect(() => {
    if (data?.getCompanyFunctionById) {
      const f = data.getCompanyFunctionById
      form.reset({
        orgId: id,
        functionName: f.functionName,
        functionType: f.functionType,
        desc: f.desc,
        viewName: f.viewName,
        tags: f.tags || [],
        isUserIntervation: f.isUserIntervation,
        isValid: f.isValid,
        returnType: f.returnType,
        companyId: id
      })
    }
    if (error) {
      toast({ title: 'Error fetching data', variant: 'destructive' })
    }
  }, [data, error, id, form, toast])

  const [updateFunction] = useMutation(companyMutation.EDIT_COMPANY_FUNCTION)

  const onSubmit = async (values: any) => {
    try {
      const { error: gqlError } = await updateFunction({
        variables: {
          functionId: id,
          input: {
            desc: values.desc,
            isValid: values.isValid,
            tags: values.tags
          }
        }
      })
      if (gqlError) throw gqlError
      toast({ title: 'Function updated', variant: 'default' })
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' })
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Company Function</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Function Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read-only fields */}
                {(['orgId', 'functionName', 'functionType', 'viewName', 'returnType', 'isUserIntervation'] as const).map(fieldName => (
                  <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{fieldName}</FormLabel>
                      <FormControl>
                        {fieldName === 'isUserIntervation'
                          ? <Checkbox checked={!!field.value} disabled />
                          : <Input {...field} value={String(field.value)} disabled />
                        }
                      </FormControl>
                    </FormItem>
                  )} />
                ))}

                {/* Editable tags field */}
                {/* <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsInput 
                      value={field.value} 
                      onChange={(tags) => field.onChange(tags)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} /> */}
                <FilterableList
                  form={form}
                  name="tags"
                  value={form.watch("tags")}
                  placeholder="Select or create tags..."
                />

                <FormField control={form.control} name="desc" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="isValid" render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 col-span-1 md:col-span-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Is Valid?</FormLabel>
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end mt-8">
                <Button type="submit">Update</Button>
              </div>
            </CardContent>
          </Card>
        </form>
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
