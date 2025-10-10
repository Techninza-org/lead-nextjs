// @ts-nocheck
"use client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from '@/hooks/use-modal-store';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowDown, ArrowUp, PlusIcon, X } from "lucide-react";
import { useMutation, useQuery } from "graphql-hooks";
import { DeptMutation } from "@/lib/graphql/dept/mutation";
import { userQueries } from "@/lib/graphql/user/queries";
import { CREATE_ROOT_USER_MUTATION } from "@/lib/graphql/user/mutations";
import { MultiSelect } from "../multi-select-new";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useCompany } from "../providers/CompanyProvider";
import { userAtom } from "@/lib/atom/userAtom";
import { useAtomValue } from "jotai";
import { useAdmin } from "../providers/AdminProvider";

// Define the schema
const DepartmentSchema = z.object({
    adminDeptForm: z.array(z.object({
        name: z.string().min(1, "Field name is required"),
        fieldType: z.string().min(1, "Field type is required"),
        ddOptionId: z.any().optional(),
        order: z.number().int().min(1, "Field order is required"),
        options: z.object({
            label: z.string(),
            value: z.any(),
        }).array().optional(),
        isRequired: z.boolean(),
        isDisabled: z.boolean(),
    })).default([]),
});

const fieldTypes = [
    { value: "INPUT", label: "Input" },
    { value: "SELECT", label: "Select" },
    { value: "RADIO", label: "Radio" },
    { value: "DD_IMG", label: "Dependent Dropdown (Image)" },
    { value: "DD", label: "Dependent Dropdown (Select)" },
    { value: "CHECKBOX", label: "Checkbox" },
    { value: "IMAGE", label: "Image" },
    { value: "TEXTAREA", label: "Textarea" },
    { value: "DATE", label: "Date" },
]

const AdminUpdateGlobalDepartmentFieldsModal = ({ deptName }: { deptName: string }) => {

    const { departmentsForms: departments } = useAdmin()
    const [currIdx, setCurrIdx] = useState(0)
    const userInfo = useAtomValue(userAtom)
    const { toast } = useToast()

    const [createDept] = useMutation(DeptMutation.CREATE_OR_UPDATE_GLOBAL_DEPTS);

    const form = useForm({
        resolver: zodResolver(DepartmentSchema),
        defaultValues: {
            adminDeptForm: []
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "adminDeptForm",
    });

    const filteredDeptFields = useMemo(() =>
        departments?.filter(field => String(field.name) === String(deptName)) || [],
        [departments, deptName])

    useEffect(() => {
        if (filteredDeptFields.length > 0) {
            const sortedSubDeptFields = filteredDeptFields[0]?.fields?.sort((a, b) => a.order - b.order) || []
            form.reset({ adminDeptForm: sortedSubDeptFields })
        }
    }, [filteredDeptFields, form])

    const { formState: { errors } } = form;

    const onSubmit = async (values: any) => {
        const { adminDeptForm } = values;

        try {
            const { data, error } = await createDept({
                variables: {
                    input: {
                        name: 'Sale Department',
                        subDeptName: deptName,
                        order: 4,
                        deptFields: adminDeptForm,
                    }
                },
            });

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
                title: "Department Form Updated Successfully!",
            });

        } catch (error) {
        }

    };


    const handleSelectChange = useCallback((value, index) => {
        form.setValue(`adminDeptForm.${index}.fieldType`, value)
        if (['SELECT', 'RADIO', 'DROPDOWN', 'CHECKBOX'].includes(value)) {
            const currentOptions = form.getValues(`adminDeptForm.${index}.options`) || []
            if (currentOptions.length === 0) {
                form.setValue(`adminDeptForm.${index}.options`, [])
            }
        }
    }, [form])

    const moveField = useCallback((index, direction) => {
        const newIndex = index + direction
        if (newIndex < 0 || newIndex >= fields.length) return

        const updatedFields = fields.map((field, idx) => ({
            ...field,
            order: idx === index ? newIndex + 1 : idx === newIndex ? index + 1 : idx + 1,
        }))

        updatedFields.splice(newIndex, 0, updatedFields.splice(index, 1)[0])
        form.setValue('adminDeptForm', updatedFields)
    }, [fields, form])

    const renderFieldOptions = useCallback(() => {
        const fieldType = form.watch(`adminDeptForm.${currIdx}.fieldType`)
        if (['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldType)) {
            return (
                <div className="mt-4">
                    <FormLabel className="mr-2">Options</FormLabel>
                    {form.watch(`adminDeptForm.${currIdx}.options`)?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center mb-2 mt-2">
                            <Input
                                placeholder="Value"
                                className="mr-2"
                                value={option.label || option.value}
                                onChange={(e) => {
                                    const value = e.target.value
                                    const options = form.getValues(`adminDeptForm.${currIdx}.options`)
                                    options[optIndex] = { label: value, value }
                                    form.setValue(`adminDeptForm.${currIdx}.options`, options)
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    const options = form.getValues(`adminDeptForm.${currIdx}.options`)
                                    options.splice(optIndex, 1)
                                    form.setValue(`adminDeptForm.${currIdx}.options`, options)
                                }}
                            >
                                <X size={20} color="red" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        onClick={() => {
                            const options = form.getValues(`adminDeptForm.${currIdx}.options`) || []
                            options.push({ label: '', value: '' })
                            form.setValue(`adminDeptForm.${currIdx}.options`, options)
                        }}
                        className="mt-2 bg-blue-500 text-white"
                    >
                        <PlusIcon size={15} />
                        Add Option
                    </Button>
                </div>
            )
        }

        if (fieldType === 'DD' || fieldType === 'DD_IMG') {
            return (
                <div className="mt-4">
                    <FormLabel className="mr-2">Dependent On</FormLabel>
                    <Select
                        onValueChange={(value) => form.setValue(`adminDeptForm.${currIdx}.ddOptionId`, value)}
                        value={form.watch(`adminDeptForm.${currIdx}.ddOptionId`) || undefined}
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select dependency" />
                        </SelectTrigger>
                        <SelectContent>
                            {form.watch('adminDeptForm').filter(x => ["SELECT", "DD"].includes(x.fieldType)).map((field, index) => (
                                field.name !== form.watch(`adminDeptForm.${currIdx}.name`) && <SelectItem key={index} value={field.name}>
                                    {field.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {form.watch(`adminDeptForm.${currIdx}.ddOptionId`) && (
                        <div className="mt-4">
                            <FormLabel className="mr-2 block">Select Values from Linked Field</FormLabel>
                            <Controller
                                name={`adminDeptForm.${currIdx}.linkedFieldValues`}
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value)
                                            const options = form.getValues(`adminDeptForm.${currIdx}.options`) || []
                                            if (!options.find(x => x.label === value)) {
                                                options.push({ label: value, value: [] })
                                                form.setValue(`adminDeptForm.${currIdx}.options`, options)
                                            }
                                        }}
                                        value={field.value || undefined}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select values" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const selectedParent = filteredDeptFields[0]?.fields.find(
                                                    (subField) => subField.name === form.watch(`adminDeptForm.${currIdx}.ddOptionId`)
                                                )
                                                if (selectedParent?.fieldType === "SELECT") {
                                                    return selectedParent.options.map((option, optIndex) => (
                                                        option.label && <SelectItem key={`${option.label}-${optIndex}`} value={option.label}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))
                                                }
                                                if (selectedParent?.fieldType === 'DD') {
                                                    return selectedParent.options.flatMap((pOption) =>
                                                        pOption.value.map((option, optIndex) => (
                                                            option.label && <SelectItem key={`${option.label}-${optIndex}`} value={option.label}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))
                                                    )
                                                }
                                                return null
                                            })()}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}

                    <FormLabel className="mr-2 mt-4 block">Options</FormLabel>
                    {form.watch(`adminDeptForm.${currIdx}.options`)?.find(x => x.label === form.watch(`adminDeptForm.${currIdx}.linkedFieldValues`))?.value.map((nestedOption, nestedIndex) => (
                        <div key={nestedIndex} className="flex items-center mb-2">
                            <Input
                                placeholder="Nested Value"
                                className="mr-2"
                                value={nestedOption.label}
                                onChange={(e) => {
                                    const value = e.target.value
                                    const options = form.getValues(`adminDeptForm.${currIdx}.options`)
                                    const optionIndex = options.findIndex(x => x.label === form.getValues(`adminDeptForm.${currIdx}.linkedFieldValues`))
                                    options[optionIndex].value[nestedIndex] = { label: value, value }
                                    form.setValue(`adminDeptForm.${currIdx}.options`, options)
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    const options = form.getValues(`adminDeptForm.${currIdx}.options`)
                                    const optionIndex = options.findIndex(x => x.label === form.getValues(`adminDeptForm.${currIdx}.linkedFieldValues`))
                                    options[optionIndex].value.splice(nestedIndex, 1)
                                    form.setValue(`adminDeptForm.${currIdx}.options`, options)
                                }}
                            >
                                <X size={20} color="red" />
                            </Button>
                        </div>
                    ))}
                    {form.watch(`adminDeptForm.${currIdx}.linkedFieldValues`) && (
                        <Button
                            type="button"
                            onClick={() => {
                                const options = form.getValues(`adminDeptForm.${currIdx}.options`)
                                const optionIndex = options.findIndex(x => x.label === form.getValues(`adminDeptForm.${currIdx}.linkedFieldValues`))
                                options[optionIndex].value.push({ label: '', value: '' })
                                form.setValue(`adminDeptForm.${currIdx}.options`, options)
                            }}
                            className="mt-2 bg-blue-500 text-white"
                        >
                            <PlusIcon size={15} />
                            Add Nested Option
                        </Button>
                    )}
                </div>
            )
        }

        return null
    }, [currIdx, form, filteredDeptFields])


    return (
        <>
            <Form {...form}>
                <Card className="grid grid-cols-3 gap-2">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-bold">Form Builder  {filteredDeptFields[0]?.name || ''}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className={`mb-4 border p-4 rounded-md ${currIdx === index ? 'bg-blue-50' : ''}`}
                                        onClick={() => setCurrIdx(index)}
                                    >
                                        <div className="grid grid-cols-8 gap-2">
                                            <div className="col-span-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`adminDeptForm.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                                    placeholder="Field Name"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`adminDeptForm.${index}.fieldType`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value)
                                                                    handleSelectChange(value, index)
                                                                    form.trigger()
                                                                    setCurrIdx(index)
                                                                }}
                                                                value={field.value || ""}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0">
                                                                        <SelectValue placeholder="Select Field Type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0">
                                                                    {fieldTypes.map(type => (
                                                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>

                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex gap-2 col-span-2">
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        moveField(index, -1)
                                                    }}
                                                    disabled={index === 0}
                                                >
                                                    <ArrowUp size={15} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        moveField(index, 1)
                                                    }}
                                                    disabled={index === fields.length - 1}
                                                >
                                                    <ArrowDown size={15} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        remove(index)
                                                    }}
                                                >
                                                    <X color="red" size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex gap-8 mt-2">
                                            <FormField
                                                control={form.control}
                                                name={`adminDeptForm.${index}.isRequired`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Required</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`adminDeptForm.${index}.isDisabled`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Disabled</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    onClick={() => append({ name: '', fieldType: '', order: fields.length + 1, isRequired: true, isDisabled: false, ddOptionId: null })}
                                    className="mt-4 bg-blue-500 text-white"
                                >
                                    Add Field
                                </Button>
                                <div className="mt-6 flex justify-end">
                                    <Button type="button" className="mr-2 bg-gray-500 text-white">Cancel</Button>
                                    <Button type="submit" variant="default" className="text-white">Submit</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-bold">Field Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderFieldOptions()}
                        </CardContent>
                    </Card>
                </Card>
            </Form>
        </>
    );
};

export default AdminUpdateGlobalDepartmentFieldsModal;