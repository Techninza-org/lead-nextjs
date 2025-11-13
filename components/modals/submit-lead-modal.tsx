// @ts-nocheck
"use client";

import React, { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "graphql-hooks";
import { useAtomValue } from "jotai";
import { userAtom } from "@/lib/atom/userAtom";
import { leadMutation } from "@/lib/graphql/lead/mutation";
import { useModal } from "@/hooks/use-modal-store";
import { IFormField } from "../formFieldsComponents/FormField";
import { FileUploaderField } from "../formFieldsComponents/FileUploaderField";
import { DatePickerField } from "../formFieldsComponents/DatePickerField";
import { formatFormData } from "@/lib/utils";

export const SubmitLeadModal = () => {

  const user = useAtomValue(userAtom);
  const { toast } = useToast();
  const [fileStates, setFileStates] = useState<{ [k: string]: File[] | null }>({});
  const { isOpen, onClose, type, data: modalData } = useModal();
  const [submitFeedback] = useMutation(leadMutation.SUBMIT_LEAD);

  const rawFields = modalData?.fields;
  const fields = rawFields ?? { name: "", childName: "", fields: [] };
  
  // Ensure fields has a name property
  if (!fields.name && rawFields) {
    fields.name = rawFields.name || "";
  }
  const lead = modalData?.lead;

  const isFlat = Array.isArray(fields.fields);
  const childName = fields.childName || "__child__";

  const parentFields = useMemo(
    () => (isFlat ? fields.fields : fields.fields[fields.name] || []),
    [fields, isFlat]
  );
  const childFields = useMemo(
    () => (isFlat ? [] : fields.fields[childName] || []),
    [fields, isFlat, childName]
  );

  const defaultValues = useMemo(() => {
    const dv: any = {};
    if (isFlat) {
      parentFields.forEach((f: any) => {
        dv[f.name] = "";
      });
    } else {
      dv[fields.name] = {};
      parentFields.forEach((f: any) => {
        dv[fields.name][f.name] = "";
      });
    }
    dv[childName] = [];
    return dv;
  }, [isFlat, fields.name, parentFields, childName]);

  const form = useForm({
    defaultValues,
    mode: "onSubmit",
    criteriaMode: "all",
  });
  const { control, handleSubmit, reset } = form;

  const {
    fields: childEntries,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: childName,
  });


  const isModalOpen = isOpen && type === "submitLead";
  if (!isModalOpen) return null;


  const handleFileChange = (fieldName: string, files: File[] | null) => {
    setFileStates((prev) => ({ ...prev, [fieldName]: files }));
  };

  const onSubmit = async (data: any) => {
    let parentformattedData: any;
    let childformattedData: any[] = [];

    if (isFlat) {
      parentformattedData = formatFormData(parentFields, data);
    } else {
      parentformattedData = formatFormData(parentFields, data[fields.name]);
      childformattedData = (data[childName] || []).flatMap((entry: any) =>
        formatFormData(childFields, entry)
      );
    }

    try {
      const formDataPayload = new FormData();
      Object.entries(fileStates).forEach(([fn, files]) =>
        files?.forEach((f) => formDataPayload.append(fn, f))
      );
      if ([...formDataPayload.keys()].length > 0) {
        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_API || "http://localhost:8080"}/graphql/upload`,
          { method: "POST", body: formDataPayload }
        );
        await uploadRes.json();
      }

      // 3) Build and fire mutation
      const variables: any = {
        deptId: user?.deptId,
        leadId: lead?.id || "",
        callStatus: "SUCCESS",
        paymentStatus: "PENDING",
        feedback: parentformattedData,
        formName: fields.name,
      };

      if (isFlat) {
        variables.submitType = "updateLead";
      } else {
        variables.childFormValue = childformattedData;
        variables.dependentOnFormName = fields.childName;
      }

      const { error } = await submitFeedback({ variables });
      if (error) {
        const msg = error.graphQLErrors?.map((e: any) => e.message).join(", ");
        toast({ variant: "destructive", title: "Error", description: msg });
      } else {
        toast({ variant: "default", title: "Lead Submitted Successfully!" });
        // Refetch the table data
        if (modalData?.refetch) {
          await modalData.refetch();
        }
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-sm text-black">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            {fields.name || "Submit Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent fields */}
            {isFlat
              ? parentFields.map((sf: any) => (
                  <IFormField
                    key={sf.id}
                    field={sf}
                    fieldName={sf.name}
                    form={form}
                    validationRules={sf.isRequired ? { required: "Required" } : {}}
                  />
                ))
              : parentFields.map((sf: any) => (
                  <IFormField
                    key={sf.id}
                    field={sf}
                    fieldName={`${fields.name}.${sf.name}`}
                    form={form}
                    validationRules={sf.isRequired ? { required: "Required" } : {}}
                  />
                ))}

            {!isFlat && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{fields.childName}</h3>
                {childEntries.map((entry, idx) => (
                  <div key={entry.id} className="p-4 border rounded relative">
                    {childFields.map((sf: any) => {
                      const inputName = `${childName}[${idx}].${sf.name}`;

                      if (sf.fieldType === "IMAGE" || sf.fieldType === "DD_IMG") {
                        return (
                          <FileUploaderField
                            key={sf.id}
                            field={sf}
                            fieldName={inputName}
                            form={form}
                            fileStates={fileStates}
                            handleFileChange={handleFileChange}
                          />
                        );
                      }
                      if (sf.fieldType === "DATE") {
                        return (
                          <DatePickerField
                            key={sf.id}
                            field={sf}
                            fieldName={inputName}
                            form={form}
                            validationRules={sf.isRequired ? { required: "Required" } : {}}
                          />
                        );
                      }
                      return (
                        <IFormField
                          key={sf.id}
                          field={sf}
                          fieldName={inputName}
                          form={form}
                          validationRules={sf.isRequired ? { required: "Required" } : {}}
                        />
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => removeChild(idx)}
                      className="absolute top-2 right-2 text-red-500"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendChild(
                      childFields.reduce((acc: any, f: any) => {
                        acc[f.name] = "";
                        return acc;
                      }, {})
                    )
                  }
                >
                  + Add {fields.childName}
                </Button>
              </div>
            )}

            <Button type="submit" className="mt-6">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
