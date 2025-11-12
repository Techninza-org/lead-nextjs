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
            // Handle different option structures:
            // 1. Direct array: [{ label, value }]
            // 2. Nested value: { value: [{ label, value }] }
            // 3. Prisma format: { value: JSON } where value is an array
            let selectOptions: any[] = [];
            
            if (Array.isArray(field.options)) {
                // Direct array format
                selectOptions = field.options;
            } else if (field.options?.value) {
                // Nested value format or Prisma JSON format
                const value = field.options.value;
                selectOptions = Array.isArray(value) ? value : [];
            } else if (field.options && typeof field.options === 'object') {
                // Fallback: try to extract from any object structure
                selectOptions = [];
            }
            
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
                                    {selectOptions.length > 0 ? (
                                        selectOptions.map((option: any, idx: number) => {
                                            const value = option.value || option.label || String(option);
                                            const label = option.label || option.value || String(option);
                                            return (
                                                <SelectItem key={value || idx} value={value}>
                                                    {label}
                                                </SelectItem>
                                            );
                                        })
                                    ) : (
                                        <SelectItem value="no-options" disabled>No options available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        case 'DD':
            // DD fields depend on a parent field (ddOptionId)
            // Watch the parent field, not the DD field itself
            const parentFieldName = field.ddOptionId;
            const parentValue = parentFieldName ? form.watch(parentFieldName) : null;
            
            // Transform options: DD options are structured as [{ label: "Parent", value: [{ label: "Child", value: "child" }] }]
            // Backend returns options as: { value: [{ label: "Parent", value: [...] }] } or directly as array
            let ddOptionsArray: any[] = [];
            
            if (field.options) {
                if (Array.isArray(field.options)) {
                    // Already in array format: [{ label, value: [...] }]
                    ddOptionsArray = field.options;
                } else if (field.options.value !== undefined) {
                    // Prisma format: { value: [...] }
                    const value = field.options.value;
                    if (Array.isArray(value)) {
                        ddOptionsArray = value;
                    } else if (typeof value === 'string') {
                        // Try parsing JSON string
                        try {
                            const parsed = JSON.parse(value);
                            ddOptionsArray = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            ddOptionsArray = [];
                        }
                    }
                }
            }
            
            // Filter and flatten options based on parent selection
            const ddOptions = ddOptionsArray.flatMap((pOption: any) => {
                // Extract parent option label and child options
                const parentOptionLabel = pOption.label || pOption.name || String(pOption);
                const childOptionsValue = pOption.value;
                
                // Check if parent field value matches this parent option's label
                // Parent value can be a string or array (for multi-select parent fields)
                let parentMatches = false;
                
                if (parentValue && parentOptionLabel) {
                    if (Array.isArray(parentValue)) {
                        // Parent is multi-select - check if any selected value matches
                        parentMatches = parentValue.some((pv: any) => 
                            String(pv) === String(parentOptionLabel) || 
                            String(pv).includes(String(parentOptionLabel)) ||
                            String(parentOptionLabel).includes(String(pv))
                        );
                    } else {
                        // Parent is single select - exact match or contains
                        const parentStr = String(parentValue);
                        const labelStr = String(parentOptionLabel);
                        parentMatches = parentStr === labelStr || 
                                       parentStr.includes(labelStr) || 
                                       labelStr.includes(parentStr);
                    }
                }
                
                // If parent matches, extract child options
                if (parentMatches && childOptionsValue) {
                    let childOptions: any[] = [];
                    
                    if (Array.isArray(childOptionsValue)) {
                        childOptions = childOptionsValue;
                    } else if (typeof childOptionsValue === 'string') {
                        // Try parsing JSON string
                        try {
                            const parsed = JSON.parse(childOptionsValue);
                            childOptions = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            childOptions = [];
                        }
                    } else if (typeof childOptionsValue === 'object' && childOptionsValue !== null) {
                        // Might be a single object, wrap in array
                        childOptions = [childOptionsValue];
                    }
                    
                    // Transform child options to { label, value } format
                    return childOptions.map((option: any) => {
                        const label = option.label || option.value || String(option);
                        const value = option.value || option.label || String(option);
                        return { label, value };
                    });
                }
                
                return [];
            });

            return (
                <FormFieldUI
                    control={form.control}
                    name={fieldName}
                    rules={validationRules}
                    render={({ field: formField }) => {
                        // Ensure value is an array for MultiSelect
                        const fieldValue = formField.value;
                        const defaultValue = Array.isArray(fieldValue) 
                            ? fieldValue 
                            : (fieldValue ? [String(fieldValue)] : []);
                        
                        return (
                            <FormItem>
                                <FormLabel className="text-primary">{field.name}</FormLabel>
                                <MultiSelect
                                    disabled={!parentValue || !parentFieldName}
                                    options={ddOptions}
                                    onValueChange={(values) => {
                                        // Ensure we're passing an array
                                        formField.onChange(Array.isArray(values) ? values : []);
                                    }}
                                    defaultValue={defaultValue}
                                    placeholder={parentValue ? field.name : `Select ${parentFieldName} first`}
                                    variant="secondary"
                                    maxCount={3}
                                />
                                <FormMessage />
                            </FormItem>
                        );
                    }}
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

