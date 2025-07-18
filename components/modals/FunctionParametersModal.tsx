// @ts-nocheck
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery } from "graphql-hooks";
import { useModal } from "@/hooks/use-modal-store";

import { IFormField } from "../formFieldsComponents/FormField";
import { FileUploaderField } from "../formFieldsComponents/FileUploaderField";
import { DatePickerField } from "../formFieldsComponents/DatePickerField";
import { adminQueries } from "@/lib/graphql/admin/queries";
import { companyMutation } from "@/lib/graphql/company/mutation";

export const FunctionParametersModal = () => {
  const form = useForm();
  const { isOpen, onClose, type, data: modalData } = useModal();
  const { toast } = useToast();
  const [executeDynamicFunction] = useMutation(companyMutation.FUNCTION_EXCUTE);

  const isModalOpen = isOpen && type === "functionParameters";
  const { id, selectedFnName, selectedFormNameIds } = modalData || {};

  const { data, error, loading } = useQuery(
    adminQueries.getCompanyFunctionById,
    { variables: { id }, skip: !isModalOpen || !id }
  );

  // show GraphQL errors in a toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading fields",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // ─── 2) Early return only after all hooks ─────────────────────────────────────
  if (!isModalOpen) return null;

  const handleClose = () => onClose();

  const handleFunctionCall = async (params: Record<string, any> = {}) => {
    const paramsWithSelectedIds = {
      ...params,
      ids: selectedFormNameIds || [],
    }
    const variables = {
      functionName: selectedFnName,
      params: paramsWithSelectedIds,
    };
    const { data: formRes, error } = await executeDynamicFunction({ variables });
    if (error) {
      const message = error.graphQLErrors?.map((e: any) => e.message).join(", ");
      toast({ title: 'Error', description: message || 'Something went wrong', variant: 'destructive' });
      return;
    }
    toast({ variant: 'default', title: 'Function executed successfully!' });
  };

  // grab your fields (flat array)
  const fields = data?.getCompanyFunctionById?.fields ?? [];

  const onSubmit = (values: any) => {
    console.log("submit!", values);
    handleFunctionCall(values);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-md text-black">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Function Parameters
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-6 pb-6"
          >
            {loading && <p>Loading fields…</p>}

            {fields.map((field: any) => {
              const fieldName = field.name;
              const validationRules = field.isRequired
                ? { required: "Required" }
                : {};

              // delegate based on your type
              switch (field.fieldType) {
                case "IMAGE":
                case "DD_IMG":
                  return (
                    <FileUploaderField
                      key={field.id}
                      field={field}
                      fieldName={fieldName}
                      form={form}
                    />
                  );

                case "DATE":
                  return (
                    <DatePickerField
                      key={field.id}
                      field={field}
                      fieldName={fieldName}
                      form={form}
                      validationRules={validationRules}
                    />
                  );

                default:
                  return (
                    <IFormField
                      key={field.id}
                      field={field}
                      fieldName={fieldName}
                      form={form}
                      validationRules={validationRules}
                    />
                  );
              }
            })}

            <div className="text-right">
              <Button type="submit">Execute</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
