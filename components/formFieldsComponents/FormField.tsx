import React from 'react'
import {
    FormControl,
    FormField as FormFieldUI,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MultiSelect } from "../multi-select-new"

interface FormFieldProps {
    field: any;
    fieldName: string;
    validationRules: any;
    form: any;
}

export const IFormField: React.FC<FormFieldProps> = ({ field, fieldName, validationRules, form }) => {
    const isDisabled = field.isDisabled;

    switch (field.fieldType) {
        case 'INPUT':
        case 'TEXTAREA':
        case 'CURRENCY':
        case 'PHONE':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{field.name}</FormLabel>
                            <FormControl>
                                <Input
                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                    placeholder={field.name}
                                    disabled={isDisabled}
                                    {...formField}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'EMAIL':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{field.name}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                    placeholder={field.name}
                                    disabled={isDisabled}
                                    {...formField}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'NUMBER':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{field.name}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                    placeholder={field.name}
                                    disabled={isDisabled}
                                    {...formField}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'WEBSITE':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="font-semibold text-primary dark:text-secondary/70">{field.name}</FormLabel>
                            <FormControl>
                                <Input
                                    type="url"
                                    className="bg-zinc-100/50 placeholder:capitalize border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                    placeholder={field.name}
                                    disabled={isDisabled}
                                    {...formField}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'SELECT':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="text-primary">{field.name}</FormLabel>
                            <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue className="placeholder:capitalize" placeholder={field.name} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {field.options.value.map((option: any) => (
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
            )
        case 'DD':
            const options = field.options.flatMap((pOption: any) => {
                if (form.watch(fieldName)?.includes(pOption.label)) {
                    return pOption.value.map((option: any) => ({
                        label: option.label,
                        value: option.value || option.label
                    }))
                }
                return []
            })

            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel className="text-primary">{field.name}</FormLabel>
                            <MultiSelect
                                disabled={!form.watch(fieldName)}
                                options={options}
                                onValueChange={formField.onChange}
                                defaultValue={formField.value}
                                placeholder={field.name}
                                variant="secondary"
                                maxCount={3}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'RADIO':
            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>{field.name}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={formField.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    {field.options?.value.map((option: any) => (
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
            )
        default:
            return null
    }
}

