import { type ClassValue, clsx } from "clsx"
import { format, isValid } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CallData {
  [key: string]: string;
}

export const isValidUrl = (url: string) => {
  const pattern = new RegExp('^(https?:\\/\\/)' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    'localhost|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?' +
    '(\\/[-a-z\\d%_.~+\\s]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$', 'i')
  return !!pattern.test(url)
}

export const formatFormData = (backendData: CallData | CallData[], formData: CallData) => {
  const formatField = (field: CallData) => {
    let value = formData[field.name];

    if (field.fieldType === "RADIO") {
      value = value === "yes" ? "Yes" : "No";
    }

    if (field.fieldType === "IMAGE" || field.fieldType === "DD_IMG") {
      return {
        name: field.name,
        fieldType: field.fieldType,
        value: Array.isArray(value) ? value : [value]
      };
    }

    return {
      name: field.name,
      fieldType: field.fieldType,
      value: value === "" ? { value: "" } : (value || ""),
    };
  };

  if (Array.isArray(backendData)) {
    return backendData.map(formatField);
  } else {
    return formatField(backendData);
  }
};

export const downloadFile = (blobData: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blobData);
  // Create an anchor element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);

  // Append the anchor element to the body and click it
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const handleFileDownload = (fileName: string) => {
  const url = `/${fileName}`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

export function formatCurrencyForIndia(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

  return formatter.format(amount);
}

interface ParsedData {
  [key: string]: string | number;
}

export const parseCSVToJson = async (file: File) => {
  const fileContent = await file.text();
  const lines = fileContent.split("\n").map(line => line.trim());

  if (lines.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const headers = lines[0].split(",").map(header => header.trim());

  const jsonData: ParsedData[] = lines.slice(1).map(line => {
    const values = line.split(",").map(value => value.trim());
    const row: ParsedData = {};

    headers.forEach((header, index) => {
      row[header] = isNaN(Number(values[index])) ? values[index] : Number(values[index]);
    });

    return row;
  });

  return { jsonData, headers };
};

export const generateCSV = (data: any, fileName: string): void => {
  const header = data?.map((item: any) => item.name).join(",") + "\n";

  const blob = new Blob([header], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateCSVFromJson = (data: any, fileName: string): void => {
  const header = Object.keys(data[0]).join(",") + "\n";
  const rows = data.map((item: any) => Object.values(item).join(",")).join("\n");

  const blob = new Blob([header, rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface Field {
  name: string;
  fieldType: string;
  ddOptionId: string | null;
  options: any | null;
  isDisabled: boolean;
  isRequired: boolean;
  imgLimit: number | null;
  order: number;
}

// Interface for field relationships
interface FieldRelationship {
  [key: string]: Field[];
}

// Interface for data items
interface DataItem {
  id: string;
  name: string;
  dependentOnId: string;
  childName?: string;
  fields: Field[] | FieldRelationship;
}

export function updateDependentFields(data: DataItem[]): DataItem[] {
  const nameToItemMap: Record<string, DataItem> = {};
  data.forEach(item => {
    nameToItemMap[item.name.trim()] = item;
  });

  data.forEach(item => {
    if (item.dependentOnId) {
      const parentName = item.dependentOnId.trim();
      const parent = nameToItemMap[parentName];

      if (parent) {
        if (Array.isArray(parent.fields)) {
          parent.fields = {
            [parent.name.trim()]: parent.fields
          } as FieldRelationship;
        }

        const parentRelationships: FieldRelationship = { ...parent.fields as FieldRelationship };

        if (item.fields && !Array.isArray(item.fields)) {
          // Merge existing relationships from item
          Object.assign(parentRelationships, item.fields);
        }

        // Add current item's fields
        if (Array.isArray(item.fields)) {
          parentRelationships[item.name.trim()] = item.fields;
        }

        // Update parent's fields with all relationships
        parent.fields = parentRelationships;

        // Set child name on parent
        parent.childName = item.name.trim();

        if (nameToItemMap[item.name.trim()]) {
          const currentItem = nameToItemMap[item.name.trim()];
          // Not required for now: as it updating the child fields

          // if (Array.isArray(currentItem.fields)) {
          //   currentItem.fields = {
          //     [item.name.trim()]: currentItem.fields,
          //     ...(item.fields as FieldRelationship)
          //   } as FieldRelationship;
          // }
        }
      }
    }
  });

  return data;
}


export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str; // Guard clause for empty strings
  return str?.charAt(0).toUpperCase() + str.slice(1);
};

export function getColumnNames(data: any) {
  const columnNames = new Set();
  const dependentCols = new Set();

  data.formValue.forEach((formItem: any) => {
    return formItem.name && columnNames.add(formItem.name);
  });
  data?.dependentOnValue?.forEach((formItem: any) => {
    return formItem.name && dependentCols.add(formItem.name);
  })
  return { columnNames: Array.from(columnNames), dependentCols: Array.from(dependentCols) };
}

export const formatReturnOfDB = (formData: any) => {
  const cols = getColumnNames(formData);
  const row: any = {};
  row.dependentValue = {};
  formData.formValue.forEach((item: any) => {
    row.createdAt = new Date(Number(item.createdAt)).toLocaleDateString();
    row[item.name] = item.value; // Might need to change handle for dependent fieldTypes
  });

  formData?.dependentOnValue?.forEach((item: any) => {
    row.dependentValue.createdAt = item.createdAt;
    row.dependentValue[item.name] = item.value; // Might need to change handle for dependent fieldTypes
  });

  return {
    cols,
    row
  }
}

export function formatDyanmicFormCols(data: any[] | null | undefined) {
  if (!data || !Array.isArray(data)) {
    return { columnNames: [] }
  }

  const columnNames = new Set<string>()

  data.forEach((x: any) => {
    if (x && typeof x === 'object') {
      Object.keys(x).forEach((key: string) => {
        columnNames.add(key)
      })
    }
  })

  return { columnNames: Array.from(columnNames) }
}

export const formatDyamicTableData = (formData: any[] | null | undefined) => {
  if (!formData || !Array.isArray(formData)) {
    return {
      cols: { columnNames: [] },
      rows: []
    }
  }

  const rows = formData.map((item: any) => {
    try {
      const row: Record<string, any> = {
        createdAt: formatDate(Number(item?.createdAt || 0)),
        followUpBy: item?.followUpBy || '',
        customerResponse: item?.customerResponse || '',
        nextFollowUpDate: formatDate(item?.nextFollowUpDate),
        remark: item?.remark || ''
      }

      // Safely handle dynamic fields
      if (Array.isArray(item?.dynamicFieldValues)) {
        item.dynamicFieldValues.forEach((field: any) => {
          if (field?.name) {
            row[field.name] = field.value ?? ''
          }
        })
      }

      return row
    } catch (err) {
      console.error('Error processing row:', err)
      return {}
    }
  }).filter(row => Object.keys(row).length > 0) // Remove empty rows

  const cols = formatDyanmicFormCols(rows)

  return {
    cols,
    rows
  }
}

export const formatDate = (date: string | number | null | undefined) => {
  if (!date) return ''
  try {
    const parsedDate = new Date(date)
    return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : ''
  } catch {
    return ''
  }
}

const leadHardCodeFields = [
  "name",
  "email",
  "phone",
  "alternatePhone",
  "rating",
  "remark",
]

const followUp = [
  "followUpBy",
  "nextFollowUpDate",
  "remark",
  "customerResponse",
  "rating"
]

function generateFields(fieldNames: string[]) {
  return fieldNames.map((name: string, index: number) => {
    const isDefaultField = ['name', 'email', 'phone'].includes(name.toLowerCase());

    return {
      name: name, // Capitalize first letter
      fieldType: "INPUT",
      ddOptionId: null,
      options: null,
      isDisabled: true,
      isRequired: false,
      imgLimit: null,
      order: index + 1,
      isHardCoded: true
    };
  });
}

export const genHardCodedFields = (formName: string) => {
  switch (decodeURIComponent(formName.toLowerCase())) {
    case "lead":
      return generateFields(leadHardCodeFields);
    case "prospect":
      return generateFields(leadHardCodeFields);
    case "lead follow up":
      return generateFields(followUp);
    default:
      return [];
  }
}

export const formatPermissions = (permissions: any[]): any[] => {
  const resourceMap = new Map<string, any>();
  

  permissions.forEach(perm => {
    if (!resourceMap.has(perm.resource)) {
      resourceMap.set(perm.resource, {
        name: perm.resource,
        permissions: {}
      });
    }

    const resource = resourceMap.get(perm.resource)!;
    resource.permissions[perm.actions] = {
      id: perm.id,
      name: perm.name,
      actions: perm.actions
    };
  });

  return Array.from(resourceMap.values());
};