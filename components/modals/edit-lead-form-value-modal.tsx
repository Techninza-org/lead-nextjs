// @ts-nocheck
"use client"
import React, { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast"
import { useMutation } from "graphql-hooks"
import { useAtomValue } from "jotai"
import { userAtom } from "@/lib/atom/userAtom"
import { leadMutation } from "@/lib/graphql/lead/mutation"
import { useModal } from "@/hooks/use-modal-store"
import { IFormField } from "../formFieldsComponents/FormField"
import { FileUploaderField } from "../formFieldsComponents/FileUploaderField"
import { DatePickerField } from "../formFieldsComponents/DatePickerField"
import { formatFormData } from "@/lib/utils"

export const EditLeadFormValueModal = () => {
    const user = useAtomValue(userAtom)
    const { toast } = useToast()
    const [fileStates, setFileStates] = useState<{ [key: string]: File[] | null }>({});
    const { isOpen, onClose, type, data: modalData } = useModal();
    const { lead, fields } = modalData;
    const isModalOpen = isOpen && type === "editLeadFormValue";
    const [editLeadFormValue, { loading: feedBackLoading }] = useMutation(leadMutation.EDIT_LEAD_FORM_VALUE);

    const formFields = useMemo(() => {
        if (Array.isArray(fields?.fields)) {
            return [{
                id: fields?.id,
                name: fields?.name,
                fields: fields?.fields
            }];
        } else {
            const parentFields = fields?.field?.[fields?.name] || [];
            const childFields = fields?.field?.[fields?.childName] || [];
            return [
                {
                    id: fields?.id,
                    name: fields?.name,
                    value: fields?.value,
                    fields: parentFields,
                },
                {
                    id: `${fields?.id}-child`,
                    name: fields?.childName,
                    value: fields?.value,
                    fields: childFields,
                },
            ].filter(field => field.fields.length > 0);
        }
    }, [fields]);

    const validationSchema = formFields.reduce((acc: any, field: any) => {
        field.fields.forEach((subField: any) => {
            if (subField.isRequired) {
                acc[`${field.name}.${subField.name}`] = { required: "Required" };
            }
        });
        return acc;
    }, {});

    const form = useForm({
        defaultValues: formFields.reduce((acc: any, field: any) => {
            if (Array.isArray(fields?.fields)) {
                field.fields.forEach((subField: any) => {
                    acc[subField.name] = subField.value || "";
                });
            } else {
                acc[field.name] = field.fields.reduce((subAcc: any, subField: any) => {
                    subAcc[subField.name] = subField.value || "";
                    return subAcc;
                }, {});
            }
            return acc;
        }, {}),
        mode: "onSubmit",
        criteriaMode: "all",
    });

    const { setValue } = form;

    useEffect(() => {
        if (formFields?.length > 0) {
            formFields.forEach((field: any) => {
                field.fields.forEach((subField: any) => {
                    const fieldName = Array.isArray(fields?.fields)
                        ? subField.name
                        : `${field.name}.${subField.name}`;
                    setValue(fieldName, subField.value || "");
                });
            });
        }
    }, [formFields, setValue]);

    const onSubmit = async (data: any) => {

        let parentformattedData;
        let childformattedData;

        if (Array.isArray(fields?.fields)) {
            parentformattedData = formatFormData(fields?.fields, data);

        } else {
            parentformattedData = formatFormData(fields?.fields?.[fields?.name], data[fields?.name])
            childformattedData = formatFormData(fields?.fields?.[fields?.childName], data[fields?.childName])
        }

        try {

            const { data: resData, loading, error } = await editLeadFormValue({
                variables: {
                    submittedFormId: fields?.id,
                    formValue: formatFormData(fields?.fields, data)
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
        } catch (error) {
            console.error("Error during submission:", error);
            toast({
                title: 'Error',
                description: "Failed to submit lead feedback.",
                variant: "destructive"
            });
        }
    };

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
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-sm">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        {fields?.name}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {formFields.map((field: any) => (
                            <div key={field.id} className="space-y-4">
                                <h3 className="text-lg font-semibold">{field.name}</h3>
                                {field.fields.map((subField: any) => {
                                    const fieldName = Array.isArray(fields?.fields) ? subField.name : `${field.name}.${subField.name}`;
                                    const validationRules = validationSchema?.[fieldName] || {};

                                    switch (subField.fieldType) {
                                        case 'INPUT':
                                        case 'TEXTAREA':
                                        case 'CURRENCY':
                                        case 'PHONE':
                                        case 'SELECT':
                                        case 'DD':
                                        case 'RADIO':
                                            return (
                                                <IFormField
                                                    key={subField.id}
                                                    field={subField}
                                                    fieldName={fieldName}
                                                    validationRules={validationRules}
                                                    form={form}
                                                />
                                            );
                                        case 'IMAGE':
                                            return (
                                                <FileUploaderField
                                                    key={subField.id}
                                                    field={subField}
                                                    fieldName={fieldName}
                                                    validationRules={validationRules}
                                                    form={form}
                                                    fileStates={fileStates}
                                                    handleFileChange={handleFileChange}
                                                />
                                            );
                                        case 'DATE':
                                            return (
                                                <DatePickerField
                                                    key={subField.id}
                                                    field={subField}
                                                    fieldName={fieldName}
                                                    validationRules={validationRules}
                                                    form={form}

                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        ))}

                        <Button type="submit" className="mt-6">Submit</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

