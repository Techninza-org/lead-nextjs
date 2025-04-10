"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'graphql-hooks';
import { userAtom } from '@/lib/atom/userAtom';
import { useAtom, useAtomValue } from 'jotai';
import {
    MultiSelector,
    MultiSelectorContent,
    MultiSelectorInput,
    MultiSelectorItem,
    MultiSelectorList,
    MultiSelectorTrigger,
} from "@/components/multiselect-input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useModal } from '@/hooks/use-modal-store';
import { createLeadSchema } from '@/types/lead';
import { leadMutation } from '@/lib/graphql/lead/mutation';

import { useLead } from '@/components/providers/LeadProvider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CallData, cn, formatFormData } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarDaysIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { useEffect, useState } from 'react';
import { deptQueries } from '@/lib/graphql/dept/queries';
import { LOGIN_USER } from '@/lib/graphql/user/mutations';
import { DropzoneOptions } from 'react-dropzone';
import { MultiSelect } from '../multi-select-new';
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from '../file-uploader';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useToast } from '../ui/use-toast';
import { PhoneInput } from '../ui/phone-input';
import { RsInput } from '../ui/currency-input';
import { DateTimePicker } from '../date-time-picker';

export const CreateLeadModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { lead, fields } = data;
    const isModalOpen = isOpen && type === "addLead";


    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="text-black max-w-screen-sm">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Create {fields?.name}
                    </DialogTitle>
                </DialogHeader>

                <LeadForm
                    fields={fields}
                    onClose={onClose}
                />

            </DialogContent>
        </Dialog>
    )
}


export const LeadForm = ({ fields, onClose }: {
    fields: any,
    onClose: any,
}) => {
    const { toast } = useToast()
    const [files, setFiles] = useState<File[] | null>([]);
    const { handleCreateLead } = useLead()
    const userInfo = useAtomValue(userAtom)


    const [fileStates, setFileStates] = useState<{ [key: string]: File[] | null }>({});

    const [createLead, { loading }] = useMutation(leadMutation.CREATE_LEAD);

    const { loading: deptLoading, error: deptError, data: deptData } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
        variables: { companyId: userInfo?.companyId },
        skip: !userInfo?.token || !userInfo?.companyId,
        refetchAfterMutations: [
            {
                mutation: LOGIN_USER
            },
        ],
    });


    const validationSchema = fields?.fields?.reduce((acc: any, field: any) => {
        if (field.isRequired) {
            acc[field.name] = { required: "Required" };
        }
        return acc;
    }, {});

    const form = useForm({
        defaultValues: fields?.fields.reduce((acc: any, field: any) => {
            acc[field.name] = "";
            return acc;
        }, {}),
        mode: "onSubmit",
        criteriaMode: "all",
    });

    const isLoading = form.formState.isSubmitting || loading;
    // try {
    const dropzone = {
        accept: {
            "image/*": [".jpg", ".jpeg", ".png"],
        },
        multiple: true,
        maxFiles: 4,
        maxSize: 1 * 1024 * 1024,
    } satisfies DropzoneOptions;

    const onSubmit = async (data: any) => {
        try {
            let uploadedFiles: any[] = [];
            if (Object.keys(fileStates)?.length) {
                const formData = new FormData();

                Object.entries(fileStates).forEach(([fieldName, files]) => {
                    files?.forEach((file: File) => {
                        formData.append(fieldName, file);
                    });
                });


                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_API || 'http://localhost:8080'}/graphql/upload`, {
                    method: 'POST',
                    body: formData
                });

                const uploadData = await uploadRes.json();
                uploadedFiles = uploadData.files;

                const formDataWithUrls = fields?.fields.map((field: any) => {
                    if (field.fieldType === 'IMAGE' || field.fieldType === 'DD_IMG') {
                        const uploadedFilesForField = uploadedFiles?.filter((file: any) => {
                            if (field.fieldType === 'DD_IMG') {
                                return field.options.find((r: any) => {
                                    return r.value.find((c: any) => c.label === file.fieldname)
                                })
                            }
                            return file.fieldname === field.name
                        });
                        if (uploadedFilesForField && uploadedFilesForField.length > 0) {
                            const urls = uploadedFilesForField.map((file: any) => file.url);
                            return { ...field, value: urls }; // Always return an array of URLs
                        }
                    }
                    return field;
                });

                const { data: resData, error } = await createLead({
                    variables: {
                        companyId: userInfo?.companyId || "",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        alternatePhone: data.alternatePhone,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        zip: data.zip,
                        department: data.department,
                        dynamicFieldValues: formatFormData((formDataWithUrls as CallData[]), data),
                    }
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
                    title: "Lead Submitted Successfully!",
                });
                handleClose();
            } else {
                // No files to upload, directly proceed with GraphQL mutation
                const { data: resData, error } = await createLead({
                    variables: {
                        companyId: userInfo?.companyId || "",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        alternatePhone: data.alternatePhone,
                        remark: data.remark,
                        department: data.department,
                        dynamicFieldValues: formatFormData(fields?.fields ?? [], data),
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
                    title: "Lead Submitted Successfully!",
                });
                handleClose();
            }
        } catch (error) {
            console.error("Error during submission:", error);
            toast({
                title: 'Error',
                description: "Failed to submit lead feedback.",
                variant: "destructive"
            });
        }
    };

    const sortedFields = fields?.fields.sort((a: any, b: any) => a.order - b.order);


    const handleClose = () => {
        form.reset();
        onClose();
    }

    const handleFileChange = (fieldName: string, files: File[] | null) => {
        setFileStates((prevState) => ({
            ...prevState,
            [fieldName]: files,
        }));
    };


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className='grid grid-cols-2 gap-2'>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">name</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-zinc-100 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        placeholder="name"
                                        disabled={isLoading}
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">email</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-zinc-100 placeholder:capitalize  border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        placeholder="email"
                                        disabled={isLoading}
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">phone</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-zinc-100 placeholder:capitalize  border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        placeholder="phone"
                                        disabled={isLoading}
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="alternatePhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">alternate Phone</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-zinc-100 border-0 placeholder:capitalize  dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        placeholder="Alternate Phone"
                                        disabled={isLoading}
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  

                    <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">Department</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger
                                            className="bg-zinc-100 placeholder:capitalize  border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        >
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent
                                        className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"

                                    >
                                        {
                                            deptData?.getCompanyDepts?.map((dept: any) => (
                                                <SelectItem key={dept.id} value={dept.id} className="capitalize">{dept.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="remark"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">Remark</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-zinc-100 border-0 placeholder:capitalize  dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                        placeholder="Remark"
                                        disabled={isLoading}
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

{sortedFields?.map((cfield: any) => {
                        //  const isRequired = cfield.isRequired;
                        const isDisabled = cfield.isDisabled;
                        const validationRules = validationSchema?.[cfield.name] || {};

                        if (['TEXTAREA', 'INPUT'].includes(cfield.fieldType)) {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{cfield.name}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder={cfield.name}
                                                    disabled={isDisabled}
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                        if (['PHONE'].includes(cfield.fieldType)) {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{cfield.name}</FormLabel>
                                            <FormControl>
                                                <PhoneInput
                                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder={cfield.name}
                                                    disabled={isDisabled}
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                        if (['DATETIME'].includes(cfield.fieldType)) {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem className="flex w-72 flex-col gap-2">
                                            <FormLabel htmlFor="datetime">{cfield.name}</FormLabel>
                                            <FormControl>
                                                <DateTimePicker granularity="minute" value={field.value || new Date()} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                        if (['CURRENCY'].includes(cfield.fieldType)) {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{cfield.name}</FormLabel>
                                            <FormControl>
                                                <RsInput
                                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder={cfield.name}
                                                    disabled={isDisabled}
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                        if (['TAG'].includes(cfield.fieldType)) {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{cfield.name}</FormLabel>
                                            <FormControl>
                                                <MultiSelector
                                                    onValuesChange={field.onChange}
                                                    values={field.value}
                                                >
                                                    <MultiSelectorTrigger>
                                                        <MultiSelectorInput placeholder="Select members to assign" />
                                                    </MultiSelectorTrigger>
                                                    <MultiSelectorContent>
                                                        <MultiSelectorList className="h-32 scrollbar-hide  overscroll-y-auto">
                                                            {
                                                                cfield.options?.map((opt: any) => (
                                                                    <MultiSelectorItem
                                                                        key={opt?.value}
                                                                        value={opt?.value || ""}
                                                                        className="capitalize"
                                                                    >
                                                                        {opt?.value}
                                                                    </MultiSelectorItem>
                                                                ))
                                                            }
                                                        </MultiSelectorList>
                                                    </MultiSelectorContent>
                                                </MultiSelector>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                        if (cfield.fieldType === 'SELECT') {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-primary">{cfield.name}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue className="placeholder:capitalize" placeholder={cfield.name} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {cfield.options.map((option: any) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            );
                        }
                        if (cfield.fieldType === 'DD') {
                            const options = cfield.options.flatMap((pOption: any) => {
                                if (form.watch(cfield.ddOptionId)?.includes(pOption.label)) {
                                    return pOption.value.map((option: any, optIndex: any) => ({
                                        label: option.label,
                                        value: option.value || option.label
                                    }))
                                }
                                return []
                            })

                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-primary">{cfield.name}</FormLabel>
                                            <MultiSelect
                                                disabled={!form.watch(cfield.ddOptionId)}
                                                options={options}
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                placeholder={cfield.name}
                                                variant="secondary"
                                                maxCount={3}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            );
                        }
                        if (cfield.fieldType === 'DD_IMG') {
                            const options = cfield.options.flatMap((pOption: any) => {
                                if (form.watch(cfield.ddOptionId)?.includes(pOption.label)) {
                                    return pOption.value.map((option: any, optIndex: any) => ({
                                        label: option.label,
                                        value: option.value || option.label
                                    }))
                                }
                                return []
                            })

                            const allLabels = cfield.options.flatMap((pOption: any) => pOption.label);
                            const isChildExist = sortedFields.some((x: any) => allLabels.includes(x.name));
                            return (
                                <>
                                    <FormField
                                        key={cfield.id}
                                        control={form.control}
                                        name={cfield.name}
                                        rules={validationRules}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-primary">{cfield.name}</FormLabel>
                                                <MultiSelect
                                                    disabled={!form.watch(cfield.ddOptionId)}
                                                    options={options}
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    placeholder={cfield.name}
                                                    variant="secondary"
                                                    maxCount={3}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {!isChildExist && form.watch(cfield.name)?.map((selectedField: any) => <FormField
                                        key={cfield.id}
                                        control={form.control}
                                        name={selectedField}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{selectedField}</FormLabel>
                                                <FileUploader
                                                    key={cfield.id}
                                                    value={fileStates[selectedField]}
                                                    fieldName={selectedField}
                                                    onValueChange={(files) => handleFileChange(selectedField, files)}
                                                    dropzoneOptions={dropzone}
                                                    imgLimit={cfield?.imgLimit}
                                                >
                                                    <FileInput>
                                                        <div className="flex items-center justify-center h-32 border bg-background rounded-md">
                                                            <p className="text-gray-400">Drop files here</p>
                                                        </div>
                                                    </FileInput>
                                                    <FileUploaderContent className="flex items-center flex-row gap-2">
                                                        {fileStates[selectedField]?.map((file: any, i: number) => (
                                                            <FileUploaderItem
                                                                key={i}
                                                                index={i}
                                                                className="size-20 p-0 rounded-md overflow-hidden"
                                                                aria-roledescription={`file ${i + 1} containing ${selectedField}`}
                                                            >
                                                                <Image
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={file.name}
                                                                    height={80}
                                                                    width={80}
                                                                    className="size-20 p-0"
                                                                />
                                                            </FileUploaderItem>
                                                        ))}
                                                    </FileUploaderContent>
                                                </FileUploader>
                                            </FormItem>
                                        )}
                                    />)}
                                </>
                            );
                        }
                        if (cfield.fieldType === 'RADIO') {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>{cfield.name}</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={cfield.value}
                                                    className="flex flex-col space-y-1"
                                                >
                                                    {cfield.options.map((option: any) => (
                                                        <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={option.value} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {option.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            );
                        }
                        if (cfield.fieldType === "IMAGE") {
                            const files = fileStates?.[cfield.name] || [];
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{field.name}</FormLabel>
                                            <FileUploader
                                                key={cfield.id}
                                                value={files}
                                                fieldName={field.name}
                                                onValueChange={(files) => handleFileChange(field.name, files)}
                                                dropzoneOptions={dropzone}
                                                imgLimit={cfield?.imgLimit}
                                            >
                                                <FileInput>
                                                    <div className="flex items-center justify-center h-32 border bg-background rounded-md">
                                                        <p className="text-gray-400">Drop files here</p>
                                                    </div>
                                                </FileInput>
                                                <FileUploaderContent className="flex items-center flex-row gap-2">
                                                    {files?.map((file: any, i: number) => (
                                                        <FileUploaderItem
                                                            key={i}
                                                            index={i}
                                                            className="size-20 p-0 rounded-md overflow-hidden"
                                                            aria-roledescription={`file ${i + 1} containing ${file.name}`}
                                                        >
                                                            <Image
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                height={80}
                                                                width={80}
                                                                className="size-20 p-0"
                                                            />
                                                        </FileUploaderItem>
                                                    ))}
                                                </FileUploaderContent>
                                            </FileUploader>
                                        </FormItem>
                                    )}
                                />
                            )
                        }

                        if (cfield.fieldType === "DATE") {
                            return (
                                <FormField
                                    key={cfield.id}
                                    control={form.control}
                                    name={cfield.name}
                                    rules={validationRules}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{cfield.name}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarDaysIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        }
                    })}
                </div>
                <Button type="submit" className="mt-6">Submit</Button>
            </form>
        </Form>
    )
}