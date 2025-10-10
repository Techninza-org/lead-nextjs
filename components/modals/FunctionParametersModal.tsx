// @ts-nocheck
"use client";
import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { companyQueries } from "@/lib/graphql/company/queries";
import { Badge } from "../ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/multiselect-input";
import { Separator } from "../ui/separator";

// ======================= Relation Options Hook =======================
/**
 * Fetches related form values for a relation field.
 * Required field properties:
 *  - relationFormName
 *  - relationFormFieldName (which field to show as label)
 */
const useRelationOptions = (field: any, enabled: boolean) => {
  const relationFormName = field?.relationFormName;
  const labelField = field?.relationFormFieldName;
  const shouldRun = enabled && !!relationFormName;

  const { data, loading, error } = useQuery(
    companyQueries.GET_SUBMITTED_FORM_VALUE,
    {
      variables: { formName: relationFormName },
      skip: !shouldRun,
    }
  );

  // ---- Normalize raw data safely ----
  const rawContainer = data?.getFormValuesByFormName;
  let raw: any[] = [];

  if (Array.isArray(rawContainer)) {
    raw = rawContainer;
  } else if (rawContainer && typeof rawContainer === "object") {
    // try common property names
    if (Array.isArray(rawContainer.items)) raw = rawContainer.items;
    else if (Array.isArray(rawContainer.records)) raw = rawContainer.records;
    else if (Array.isArray(rawContainer.data)) raw = rawContainer.data;
  }

  // ---- Map to options with guards ----
  const options = React.useMemo(
    () =>
      raw
        .filter((r) => r && (r.id || r._id)) // ensure usable
        .map((r: any) => {
          const value = r.id || r._id;
          const rawLabel =
            (labelField && r[labelField]) ??
            r[labelField] ??
            r.name ??
            r.title ??
            value;
          return {
            value: String(value),
            label: rawLabel == null ? "—" : String(rawLabel),
            raw: r,
          };
        }),
    [raw, labelField]
  );

  return { options, loading, error, rawDebug: rawContainer };
};


// ================== Relation MultiSelect Field Component ==================
const RelationMultiSelectField = ({
  fieldDef,
  form,
  fieldName,
}: {
  fieldDef: any;
  form: any;
  fieldName: string;
}) => {
  const { options, loading, error } = useRelationOptions(fieldDef, true);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {fieldDef.label || fieldDef.name}
        {fieldDef.isRequired && <span className="text-destructive ml-1">*</span>}
      </label>
      <Controller
        control={form.control}
        name={fieldName}
        rules={fieldDef.isRequired ? { required: "Required" } : {}}
        render={({ field }) => (
          <MultiSelector
            values={field.value || []}
            onValuesChange={field.onChange}
            disabled={loading}
          >
            <MultiSelectorTrigger>
              <MultiSelectorInput
                placeholder={
                  loading
                    ? "Loading..."
                    : `Select ${fieldDef.relationFormName || fieldDef.label || fieldDef.name}`
                }
              />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="max-h-56 overflow-y-auto">
                {options.map((opt) => (
                  <MultiSelectorItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MultiSelectorItem>
                ))}
                {!loading && options.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No {fieldDef.relationFormName || "records"} found.
                  </div>
                )}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        )}
      />
      {error && (
        <p className="text-xs text-destructive">
          Failed to load {fieldDef.relationFormName}: {error.message}
        </p>
      )}
      {form.formState.errors?.[fieldName]?.message && (
        <p className="text-xs text-destructive">
          {form.formState.errors[fieldName].message as string}
        </p>
      )}
      {fieldDef.helpText && (
        <p className="text-xs text-muted-foreground">{fieldDef.helpText}</p>
      )}
    </div>
  );
};

// ======================= Main Modal Component =======================
export const FunctionParametersModal = () => {
  const form = useForm();
  const { isOpen, onClose, type, data: modalData } = useModal();
  const { toast } = useToast();
  const [executeDynamicFunction] = useMutation(
    companyMutation.FUNCTION_EXCUTE
  );

  const isModalOpen = isOpen && type === "functionParameters";
  const { id, selectedFnName, selectedFormNameIds, formName, selectedData, unselectedFormNameIds } = modalData || {};


  const {
    data,
    error: fieldsError,
    loading: fieldsLoading,
  } = useQuery(adminQueries.getCompanyFunctionById, {
    variables: { id },
    skip: !isModalOpen || !id,
  });

  // Display GQL error toast
  useEffect(() => {
    if (fieldsError) {
      toast({
        title: "Error loading fields",
        description: fieldsError.message,
        variant: "destructive",
      });
    }
  }, [fieldsError, toast]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    onClose();
  };

  function b64ToBlob(b64: string, mime: string) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  }

  const handleFunctionCall = async (params: Record<string, any> = {}) => {
    const variables = {
      functionName: selectedFnName,
      params: {
        ...params,
        ids: selectedFormNameIds || [],
        unselectedIds: unselectedFormNameIds || [],
      },
    };

    const { data, error } = await executeDynamicFunction({ variables });
    if (error) {
      const message = error.graphQLErrors
        ?.map((e: any) => e.message)
        .join(", ");
      toast({
        title: "Error",
        description: message || "Something went wrong",
        variant: "destructive",
      });
      return;
    }
    const res = data?.executeDynamicFunction;
    if (res?.type === "file") {
      const blob = b64ToBlob(res.base64, res.mimeType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast({ variant: "default", title: "Function executed successfully!" });
  };

  const fields = data?.getCompanyFunctionById?.fields ?? [];

  const onSubmit = (values: any) => {
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

        <div className="px-6  max-h-[150px] overflow-y-auto">
          <h4 className="mb-4 text-sm font-medium leading-none">
            Selected {formName}
            {selectedFormNameIds?.length > 0 && (
              <>
                <Badge className="ml-2" variant={"secondary"}>
                  {selectedFormNameIds?.[0]}
                </Badge>
                {selectedFormNameIds?.length > 1 && (
                  <Badge className="ml-2" variant={"secondary"}>
                    + {selectedFormNameIds.length - 1}
                  </Badge>
                )}
              </>
            )}
            {selectedData?.length > 0 && selectedData.map((lead) => {
              const { _id, children, ...filteredLead } = lead;
              const mainKey = Object.keys(filteredLead)[0];

              return (
                <div className="mt-3">
                  <div key={lead._id} className="text-sm grid-cols-2 grid font-normal">
                    <span>{lead._id}</span>
                    <span>{filteredLead[mainKey]}</span>
                  </div>
                  <Separator className="my-2" />
                </div>
              )

            })}
          </h4>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 pb-8"
          >
            {fieldsLoading && <p>Loading fields…</p>}

            {fields.map((field: any) => {
              const fieldName = field.name;
              const validationRules = field.isRequired
                ? { required: "Required" }
                : {};

              if (field.isRelation) {
                return (
                  <RelationMultiSelectField
                    key={field.id}
                    fieldDef={field}
                    form={form}
                    fieldName={fieldName}
                  />
                );
              }

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

            <div className="text-right pt-2">
              <Button type="submit">Execute</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
