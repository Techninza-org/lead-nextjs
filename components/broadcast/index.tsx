'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAtomValue } from 'jotai'
import { userAtom } from '@/lib/atom/userAtom'

type Value = {
    id: string
    name: string
    values: Value[]
}

type Option = {
    name: string
    order: number
    type: string
    values: Value[]
}

type SubCategory = {
    name: string
    options: Option[]
}

type BroadcastForm = {
    id: string
    name: string
    order: number
    subCategories: SubCategory[]
}

type FormData = {
    subCategory: string
    option: string
    value: string
}

export const BroadcastForm = ({ broadcastFormStructure }: { broadcastFormStructure: any }) => {
    const user = useAtomValue(userAtom)
    const [formStructure, setFormStructure] = useState<BroadcastForm[]>([])
    
    const { control, handleSubmit, watch, setValue } = useForm<FormData>()

    useEffect(() => {
        setFormStructure(broadcastFormStructure)
    }, [broadcastFormStructure])

    const watchSubCategory = watch('subCategory')
    const watchOption = watch('option')

    const [options, setOptions] = useState<Option[]>([])
    const [values, setValues] = useState<Value[]>([])

    useEffect(() => {
        if (watchSubCategory) {
            const selectedSubCategory = formStructure[0].subCategories.find(sc => sc.name === watchSubCategory)
            setOptions(selectedSubCategory?.options || [])
            setValue('option', '')
            setValue('value', '')
        }
    }, [watchSubCategory, formStructure, setValue])

    useEffect(() => {
        if (watchOption) {
            const selectedOption = options.find(o => o.name === watchOption)
            setValues(selectedOption?.values || [])
            setValue('value', '')
        }
    }, [watchOption, options, setValue])

    const onSubmit =async  (data: FormData) => {
        try {
            let uploadedFiles: any[] = [];

            const formData = new FormData();

            formData.append('subCategory', data.subCategory);
            formData.append('option', data.option);
            data?.value && formData.append('value', data.value);

            // For image
            // Object.keys(fileStates).forEach((fieldName) => {
            //     const filesForField = fileStates[fieldName];
            //     filesForField?.forEach((file, index) => {
            //         formData.append(`${fieldName}_${index}`, file);
            //     });
            // });

            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_API || 'http://localhost:8080'}/graphql/broadcastMessage`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `x-lead-token ${user?.token}`,
                }
            });

            const uploadData = await uploadRes.json();

            // if (!uploadRes.ok) {
            //     throw new Error("Failed to upload files");
            // }

            // toast({
            //     variant: "default",
            //     title: "Lead Submitted Successfully!",
            // });
            // handleClose();
        } catch (error) {
            console.error("Error during submission:", error);
            // toast({
            //     title: 'Error',
            //     description: "Failed to submit lead feedback.",
            //     variant: "destructive"
            // });
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <div className="space-y-2">
                <Label htmlFor="subCategory">{formStructure?.[0]?.name}</Label>
                <Controller
                    name="subCategory"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a sub category" />
                            </SelectTrigger>
                            <SelectContent>
                                {formStructure?.[0]?.subCategories?.map((subCategory) => (
                                    <SelectItem key={subCategory.name} value={subCategory.name}>
                                        {subCategory.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            {watchSubCategory && (
                <div className="space-y-2">
                    <Label htmlFor="option">Option</Label>
                    <Controller
                        name="option"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option) => (
                                        <SelectItem key={option.name} value={option.name}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            )}

            {watchOption && values.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Controller
                        name="value"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a value" />
                                </SelectTrigger>
                                <SelectContent>
                                    {values.map((value) => (
                                        <SelectItem key={value.id} value={value.id}>
                                            {value.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            )}

            <Button type="submit" className="w-full">Submit</Button>
        </form>
    )
}