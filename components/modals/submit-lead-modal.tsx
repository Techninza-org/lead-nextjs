// @ts-nocheck
"use client"
import React, { useState, useMemo } from "react"
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

export const SubmitLeadModal = () => {
    const user = useAtomValue(userAtom)
    const { toast } = useToast()
    const [fileStates, setFileStates] = useState<{ [key: string]: File[] | null }>({});
    const { isOpen, onClose, type, data: modalData } = useModal();
    const { lead, fields } = modalData;
    const isModalOpen = isOpen && type === "submitLead";
    const [submitFeedback, { loading: feedBackLoading }] = useMutation(leadMutation.SUBMIT_LEAD);

    const formFields = useMemo(() => {
        if (Array.isArray(fields?.fields)) {
            return [{
                id: fields?.id,
                name: fields?.name,
                fields: fields?.fields
            }];
        } else {
            const parentFields = fields?.fields?.[fields?.name] || [];
            const childFields = fields?.fields?.[fields?.childName] || [];
            return [
                {
                    id: fields?.id,
                    name: fields?.name,
                    fields: parentFields,
                },
                {
                    id: `${fields?.id}-child`,
                    name: fields?.childName,
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
                    acc[subField.name] = "";
                });
            } else {
                acc[field.name] = field.fields.reduce((subAcc: any, subField: any) => {
                    subAcc[subField.name] = "";
                    return subAcc;
                }, {});
            }
            return acc;
        }, {}),
        mode: "onSubmit",
        criteriaMode: "all",
    });

    const onSubmit = async (data: any) => {
        let parentformattedData;
        let childformattedData;

        if (Array.isArray(fields?.fields)) {
            parentformattedData = formatFormData(fields?.fields, data);

        } else {
            parentformattedData = formatFormData(fields?.fields[fields.name], data[fields.name])
            childformattedData = formatFormData(fields?.fields[fields.childName], data[fields.childName])
        }

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

                const { data: resData, loading, error } = await submitFeedback({
                    variables: {
                        deptId: user?.deptId,
                        leadId: lead?.id || "",
                        callStatus: "SUCCESS",
                        paymentStatus: "PENDING",
                        feedback: parentformattedData,
                        submitType: "updateLead",
                        formName: fields?.name || "",
                        childFormValue: childformattedData || [],
                        dependentOnFormName: fields?.childName,

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
            } else {
                // No files to upload, directly proceed with GraphQL mutation
                const { data: resData, loading, error } = await submitFeedback({
                    variables: {
                        formName: fields?.name,
                        dependentOnFormName: fields?.childName,
                        deptId: "user?.deptId",
                        leadId: lead?.id || "",
                        callStatus: "SUCCESS",
                        paymentStatus: "PENDING",
                        feedback: parentformattedData,
                        childFormValue: childformattedData,
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
                                                    // validationRules={validationRules}
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

