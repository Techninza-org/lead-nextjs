"use client"

import React, { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useAtomValue } from "jotai"
import { userAtom } from "@/lib/atom/userAtom"
import { useModal } from "@/hooks/use-modal-store"
import { generateCSV, parseCSVToJson } from "@/lib/utils"

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

  const { formName = "Items", fields } = modalData || {}
  const dynamicFields = fields?.fields || []
  console.log("Dynamic fields:", dynamicFields);
  console.log(fields, "fields from modalData");
  
  

  // Sort server-provided fields into the order you want
  const sortedFields = useMemo(
    () => [...dynamicFields].sort((a, b) => a.order - b.order),
    [dynamicFields]
  )

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

  // Parse user-uploaded CSV into JSON + headers
//   const handleCSVChange = async ({ files }: { files: File[] | null }) => {
//     if (!files || files.length === 0) return
//     try {
//       const { jsonData, headers } = await parseCSVToJson(files[0])
//       setUploadCSVData(jsonData)
//       setUploadedCSVHeaders(headers)
//     } catch (err) {
//       console.error("Error parsing CSV:", err)
//     }
//   }

const handleCSVChange = async (newFiles: File[] | null) => {
  setFiles(newFiles);
  if (!newFiles || newFiles.length === 0) return;
  try {
    const { jsonData, headers } = await parseCSVToJson(newFiles[0]);
    setUploadCSVData(jsonData);
    setUploadedCSVHeaders(headers);

    // Track mapped headers
    const mappedHeaders = new Set<string>();

    sortedFields.forEach((field) => {
      if (headers.includes(field.name)) {
        form.setValue(field.name, field.name);
        mappedHeaders.add(field.name);
      } else {
        form.setValue(field.name, ""); // explicitly clear non-matched
      }
    });

    // Save mappedHeaders to state for easy reference
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


  // Remap each CSV row into your form-field keys
  const updateCsvKeys = (
    csvData: any[],
    formDataMapping: Record<string, string>
  ) =>
    csvData.map((row) => {
      const out: Record<string, any> = {}
      Object.entries(formDataMapping).forEach(([formKey, csvKey]) => {
        out[formKey] = row[csvKey]
      })
      return out
    })

  // Wrap any non-static fields into dynamicFieldValue
  const wrapFieldsInDynamicFieldValueArray = (
    fields: any[],
    inputData: any[],
    tags: string[] = []
  ) =>
    inputData.map((data) => {
      const dynamicFieldValue: Record<string, any> = {}
      const updatedData: Record<string, any> = { ...data }

      fields.forEach((field) => {
        if (data[field.name] !== undefined) {
          dynamicFieldValue[field.name] = data[field.name]
          dynamicFieldValue['dateUploaded'] = new Date()
          delete updatedData[field.name]
        }
      })
      
      updatedData.dynamicFieldValue = dynamicFieldValue
      updatedData.tags = tags // Add tags directly to the row
      updatedData.form = formName // Add table details
      return updatedData
    })

  // Generate a one-row “sample” CSV with every header = your dynamic field names
  const handleDownloadSample = () => {
    const sampleRow = sortedFields.reduce<Record<string, string>>((acc, fld) => {
      acc[fld.name] = ""
      return acc
    }, {})
    const arr = Object.keys(sampleRow).map(key=>({ name:key }));
    
    generateCSV(arr, `${formName}-sample`)
  }
  

  // Submit handler
  const onSubmit = async (mapping: Record<string, string>) => {
    if (!uploadCSVData) return
    // Map CSV → form keys, then wrap dynamic fields
    const tags = form.getValues("tags") || []
    const mapped = updateCsvKeys(uploadCSVData, mapping)
    const payload = wrapFieldsInDynamicFieldValueArray(
      sortedFields,
      mapped,
      tags
    )

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
      <DialogContent className="max-w-screen-md text-black">
        <DialogHeader className="pt-6">
          <DialogTitle className="flex justify-between text-2xl font-bold">
            <span>Upload {formName}</span>
            {/* {files && files.length > 0 && (
  <div className="mb-4 text-sm text-gray-700">
    Uploaded file: <span className="font-medium">{files[0].name}</span>
  </div>
)} */}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex justify-center w-full">
              {uploadedCSVHeaders.length ? (
                <ScrollArea className="h-[390px] w-full p-2">
                    <FilterableList
                  form={form}
                  name="tags"
                  value={form.watch("tags")}
                  placeholder="Select or create tags..."
                />
                  <div className="grid grid-cols-2 gap-2">
                    {sortedFields.map((fld) => (
                     <FormField
                     key={fld.id}
                     control={form.control}
                     name={fld.name}
                     rules={validationSchema[fld.name] || {}}
                     render={({ field }) => {
                       const isMatched = mappedHeaders.includes(fld.name);
                       return (
                         <FormItem>
                           <FormLabel>
                             {fld.name}{" "}
                             {/* {!isMatched && (
                               <span className="text-red-500 text-xs">(unmatched)</span>
                             )} */}
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
                               <SelectTrigger
                                 className={isMatched ? "" : "border-red-500"}
                               >
                                 <SelectValue placeholder="Select column" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               {uploadedCSVHeaders
                                 .filter(
                                   (h) =>
                                     !Object.entries(form.getValues()).some(
                                       ([key, value]) => value === h && key !== fld.name
                                     )
                                 )
                                 .map((h) => (
                                   <SelectItem key={h} value={h}>
                                     {h}
                                   </SelectItem>
                                 ))}
                             </SelectContent>
                           </Select>
                           <FormMessage />
                         </FormItem>
                       );
                     }}
                   />
                   
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <FileUploader
                  value={files}
                  fieldName={"file"}
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
                  <FileUploaderContent className="flex items-center gap-2">
                    {/* no preview for CSV */}
                  </FileUploaderContent>
                </FileUploader>
              )}
            </div>

            <div className="flex justify-between mt-6">
             {!uploadedCSVHeaders.length &&  <Button
                variant="default"
                color="primary"
                size="sm"
                className="items-center gap-1"
                onClick={handleDownloadSample}
              >
                <UploadIcon size={15} />
                <span>Sample {formName}</span>
              </Button>}

            {uploadedCSVHeaders.length > 0 && <Button
            variant="default"
            color="primary"
            size="sm"
            type="submit"
            className="items-center gap-1"
            >
            Submit {formName}
            </Button>}
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
  }: {
    form: any;
    name: string;
    value?: any;
    placeholder?: string;
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
                options={[]} 
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
  