"use client"

import React, { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useAtomValue } from "jotai"
import { userAtom } from "@/lib/atom/userAtom"
import { useModal } from "@/hooks/use-modal-store"
import { cn, generateCSV, parseCSVToJson } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/file-uploader"
import { UploadIcon } from "lucide-react"
import Image from "next/image"
import type { DropzoneOptions } from "react-dropzone"
import MultipleSelector from "../multi-select-shadcn-expension"

const dropzone = {
  accept: { "text/csv": [".csv"] },
  multiple: false,
  maxFiles: 1,
  maxSize: 2 * 1024 * 1024,
} satisfies DropzoneOptions

export const UploadFormModal = () => {
  const userInfo = useAtomValue(userAtom)
  const [files, setFiles] = useState<File[] | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [mappedHeaders, setMappedHeaders] = useState<string[]>([]);
  const { isOpen, onClose, type, data: modalData } = useModal()
  const isModalOpen = isOpen && type === "uploadFormModal"

  const { formName = "Items", fields, existingTags } = modalData || {}
  // const dynamicFields = fields?.fields || []
  

  // Replace your current dynamicFields logic with this:
const dynamicFields = useMemo(() => {
  if (!fields) return [];

  // Case 1: fields itself is an array
  if (Array.isArray(fields)) {
    return fields;
  }

  // If fields.fields exists…
  const { fields: flds } = fields as { fields?: any };

  if (!flds) {
    return [];
  }

  // Case 2: fields.fields is an array
  if (Array.isArray(flds)) {
    return flds;
  }

  // Case 3: fields.fields is an object whose values are arrays
  if (typeof flds === "object") {
    return Object.values(flds).flat();
  }

  return [];
}, [fields]);


  const sortedFields = useMemo(() => {
    if (!Array.isArray(dynamicFields)) return []
    return dynamicFields
      .map((f, i) => ({ order: f.order ?? i, ...f }))
      .sort((a, b) => a.order - b.order)
  }, [dynamicFields])

  // Build validation rules & default-values from sortedFields
  const validationSchema = useMemo(
    () =>
      sortedFields.reduce<Record<string, any>>((acc, fld) => {
        if (fld.isRequired) {
          acc[fld.name] = { required: `${fld.name} is required` }
        }
        return acc
      }, {}),
    [sortedFields]
  )

  const form = useForm({
    defaultValues: sortedFields.reduce<Record<string, any>>((acc, fld) => {
        acc[fld.name] = ""
        return acc
      }, {
        tags: [] as string[],   // ← add tags default
      }),
    mode: "onSubmit",
    criteriaMode: "all",
  })

  // CSV-upload state
  const [uploadedCSVHeaders, setUploadedCSVHeaders] = useState<string[]>([])
  const [uploadCSVData, setUploadCSVData] = useState<any[]>()

  const handleCSVChange = async (newFiles: File[] | null) => {
    setFiles(newFiles);
    if (!newFiles || newFiles.length === 0) return;
    try {
      const { jsonData, headers } = await parseCSVToJson(newFiles[0]);
      setUploadCSVData(jsonData);
      setUploadedCSVHeaders(headers);
  
      const mappedHeaders = new Set<string>();
  
      sortedFields.forEach((field) => {
        if (headers.includes(field.name)) {
          form.setValue(field.name, field.name);
          mappedHeaders.add(field.name);
        } else {
          form.setValue(field.name, "");
        }
      });
  
      if (fields?.childName && Array.isArray(fields?.fields?.[fields.childName])) {
        fields.fields[fields.childName].forEach((childField: any) => {
          const key = `${fields.childName}-${childField.name}`; // hyphenated name
          if (headers.includes(key)) {
            form.setValue(`${fields.childName}-${childField.name}`, key); // 🟢 Use hyphen
            mappedHeaders.add(key);
          } else {
            form.setValue(`${fields.childName}-${childField.name}`, ""); // 🟢 Use hyphen
          }
        });
      }
  
      setMappedHeaders(Array.from(mappedHeaders));
    } catch (err) {
      console.error("Error parsing CSV:", err);
    }
  };
  

const updateMappedHeaders = (fieldName: string, selectedHeader: string) => {
  setMappedHeaders((prev) => {
    const newMapped = prev.filter((h) => h !== fieldName);
    if (selectedHeader) newMapped.push(selectedHeader);
    return newMapped;
  });
};


const updateCsvKeys = (
  csvData: any[],
  formDataMapping: Record<string, string>
) =>
  csvData.map((row) => {
    const out: Record<string, any> = {};
    Object.entries(formDataMapping).forEach(([formKey, csvKey]) => {
      out[formKey] = row[csvKey];
    });
    return out;
  });

  const wrapFieldsInDynamicFieldValueArray = (
    allFields: any,
    inputData: any[],
    tags: string[] = []
  ) => {
    const childName = allFields?.childName;
    
    
    const childFields = Array.isArray(allFields?.fields?.[childName])
      ? allFields.fields[childName]
      : [];

    
  
    // Create keys like "RelationTest.name"
    const childFieldKeys = new Set(
      childFields.map((f: any) => `${childName}-${f.name}`)
    );
    
  
    const cleanedData = inputData.filter((row) =>
      Object.values(row).some(
        (val) => val != null && String(val).trim() !== ""
      )
    );  
    
  
    return cleanedData.map((row) => {
      const dynamicFieldValue: Record<string, any> = {};
      const childFieldValue: Record<string, any> = {};
  
      for (const [key, value] of Object.entries(row)) {
        if (childFieldKeys.has(key)) {
          const fieldName = key.replace(`${childName}-`, "");
          childFieldValue[fieldName] = value;
        } else {
          dynamicFieldValue[key] = value;
        }
      }
  
      dynamicFieldValue.dateUploaded = new Date();
  
      return {
        form: allFields?.name || "UnnamedForm",
        tags,
        dynamicFieldValue,
        childFormName: childName,
        childFieldValue,
      };
    });
  };
  
  
  
  

  // Generate a one-row “sample” CSV with every header = your dynamic field names
  // const handleDownloadSample = () => {
  //   const sampleRow = sortedFields.reduce<Record<string, string>>((acc, fld) => {
  //     acc[fld.name] = ""
  //     return acc
  //   }, {})
  //   const arr = Object.keys(sampleRow).map(key=>({ name:key }));
    
  //   generateCSV(arr, `${formName}-sample`)
  // }
  type Field = {
    name: string;
    order?: number;
    isRequired?: boolean;
    isUnique?: boolean;
    children?: Field[];
    [key: string]: any;
  };
  
  const handleDownloadSample = () => {
    if (!fields) return;
  
    const childName = fields.childName;
    const parentFields: Field[] = Array.isArray(fields.fields)
      ? fields.fields
      : Array.isArray(fields?.fields?.[childName])
        ? (Object.values(fields.fields).flat() as Field[]).filter((fld: Field) =>
            !fields.fields[childName].some((cf: Field) => cf.name === fld.name)
          )
        : [];
  
    const childFields: Field[] = Array.isArray(fields?.fields?.[childName])
      ? fields.fields[childName]
      : [];
  
    // Flatten function for nested children (if needed)
    const flattenFields = (flds: Field[], prefix = ''): { name: string }[] => {
      return flds.flatMap((fld) => {
        const namePrefix = prefix ? `${prefix}-` : '';
        if (Array.isArray(fld.children)) {
          return flattenFields(fld.children, `${namePrefix}${fld.name}`);
        }
        return [{ name: `${namePrefix}${fld.name}` }];
      });
    };
  
    const parentHeaders = flattenFields(parentFields);
    const childHeaders = flattenFields(childFields, childName);
  
    const allHeaders = [...parentHeaders, ...childHeaders];
  
    const sampleRow = allHeaders.reduce<Record<string, string>>((acc, fld) => {
      acc[fld.name] = '';
      return acc;
    }, {});
  
    generateCSV(allHeaders, `${formName}-sample`);
  };
  
  
  

  // Submit handler
  const onSubmit = async (mapping: Record<string, string>) => {
    if (!uploadCSVData) return
    // Map CSV → form keys, then wrap dynamic fields
    const tags = form.getValues("tags") || []
    const mapped = updateCsvKeys(uploadCSVData, mapping)
    const payload = wrapFieldsInDynamicFieldValueArray(
      fields,  // <-- full config object with .name and .childName
      mapped,
      tags
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_API ||
          "http://localhost:8080"}/graphql/bulk-upload-form`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `x-lead-token ${userInfo?.token || ""}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) throw new Error("Upload failed")

      // If CSV error report comes back, download it
      const ct = res.headers.get("Content-Type") || ""
      if (ct.includes("text/csv")) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "error_report.csv"
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        await res.json()
        // Refetch the table data after successful upload
        if (modalData?.refetch) {
          await modalData.refetch();
        }
      }
    } catch (err) {
      console.error("Error uploading CSV:", err)
    }
  }

  const handleClose = () => {
    setFiles(null);
    setUploadedCSVHeaders([]);
    setUploadCSVData(undefined);
    form.reset(sortedFields.reduce<Record<string, any>>((acc, fld) => {
      acc[fld.name] = "";
      return acc;
    }, {
      tags: [],
    }));
    onClose();
  };

  return (
<Dialog open={isModalOpen} onOpenChange={handleClose}>
  <DialogContent className="max-w-screen-sm text-black">
    <DialogHeader className="pt-8 px-6">
      <DialogTitle className="text-2xl text-center font-bold">
        {fields?.name || "Submit Lead"}
      </DialogTitle>
    </DialogHeader>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {uploadedCSVHeaders.length > 0 && (
          <>
            <FilterableList
              form={form}
              name="tags"
              value={form.watch("tags")}
              existing={existingTags}
              placeholder="Select or create tags..."
            />

            {/* Parent Fields */}
            <div className="grid grid-cols-2 gap-2">
              {sortedFields
                .filter((fld) => {
                  if (!fields?.childName || !Array.isArray(fields.fields?.[fields.childName])) return true;
                  return !fields.fields[fields.childName].some((cf: any) => cf.name === fld.name);
                })
                .map((fld) => (
                  <FormField
                    key={fld.id || fld.name}
                    control={form.control}
                    name={fld.name}
                    rules={validationSchema[fld.name] || {}}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {fld.name} {fld.isUnique && (
                            <span className="text-red-500 text-xs ml-3">Unique</span>
                          )}
                        </FormLabel>
                        <Select
                          disabled={!uploadedCSVHeaders.length}
                          onValueChange={(val) => {
                            field.onChange(val);
                            updateMappedHeaders(fld.name, val);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uploadedCSVHeaders.map((h) => (
                              <SelectItem
                                key={h}
                                value={h}
                                className={cn(!mappedHeaders.includes(h) && "text-red-500 font-semibold")}
                              >
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
            </div>

            {/* Child Fields */}
            {fields?.childName && Array.isArray(fields?.fields?.[fields.childName]) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{fields.childName}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {fields.fields[fields.childName].map((fld: any) => (
                    <FormField
                      key={fld.id || fld.name}
                      control={form.control}
                      name={`${fields.childName}-${fld.name}`}
                      rules={fld.isRequired ? { required: `${fld.name} is required` } : {}}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {fld.name} {fld.isUnique && (
                              <span className="text-red-500 text-xs ml-3">Unique</span>
                            )}
                          </FormLabel>
                          <Select
                            disabled={!uploadedCSVHeaders.length}
                            onValueChange={(val) => {
                              field.onChange(val);
                              updateMappedHeaders(`${fields.childName}.${fld.name}`, val);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {uploadedCSVHeaders.map((h) => (
                                <SelectItem
                                  key={h}
                                  value={h}
                                  className={cn(!mappedHeaders.includes(h) && "text-red-500 font-semibold")}
                                >
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* File Upload (when no CSV yet) */}
        {!uploadedCSVHeaders.length && (
          <FileUploader
            value={files}
            fieldName="file"
            onValueChange={handleCSVChange}
            dropzoneOptions={dropzone}
            imgLimit={1}
            className="w-full"
          >
            <FileInput>
              <div className="flex items-center justify-center h-32 border bg-background rounded-md">
                <p className="text-gray-400">Drop CSV here</p>
              </div>
            </FileInput>
            <FileUploaderContent className="flex items-center gap-2" />
          </FileUploader>
        )}

        <div className="flex justify-between pt-2">
          {!uploadedCSVHeaders.length && (
            <Button
              variant="default"
              color="primary"
              size="sm"
              className="items-center gap-1"
              onClick={handleDownloadSample}
              type="button"
            >
              <UploadIcon size={15} />
              <span>Sample {formName}</span>
            </Button>
          )}

          {uploadedCSVHeaders.length > 0 && (
            <Button
              variant="default"
              color="primary"
              size="sm"
              type="submit"
              className="items-center gap-1"
            >
              Submit {formName}
            </Button>
          )}
        </div>
      </form>
    </Form>
  </DialogContent>
</Dialog>
  )
}



function FilterableList({
    form,
    name,
    value,
    placeholder = "Select tags...",
    existing: existingTags = [],
  }: {
    form: any;
    name: string;
    value?: any;
    placeholder?: string;
    existing?: string[];
  }) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="capitalize text-xs font-bold text-zinc-500 dark:text-secondary/70">
              {name}
            </FormLabel>
            <FormControl>
              <MultipleSelector
                value={(field.value || []).map((v: string) => ({ label: v, value: v }))}
                onChange={(selected: any[]) => {
                  form.setValue(name, selected.map((s) => s.value));
                }}
                creatable
                hidePlaceholderWhenSelected
                options={(existingTags || []).map(tag => ({ label: tag, value: tag } as any))}
                badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                triggerSearchOnFocus
                placeholder={placeholder}
                emptyIndicator={
                  <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                    no tags found.
                  </p>
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
  