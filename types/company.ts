import { z } from "zod";

export const companyDeptSchema = z.object({
    id: z.string(),
    name: z.string(),
    companyDeptForms: z.array(z.object({
        id: z.string(),
        name: z.string(),
        subDeptFields: z.array(z.object({
            id: z.string(),
            name: z.string(),
        })),
    })),
})

export const SubDeptFieldSchema = z.object({
    name: z.string(),
    fieldType: z.string(),
});

export const CompanyDeptFieldSchema = z.object({
    id: z.string(),
    name: z.string(),
    subDeptFields: z.array(SubDeptFieldSchema),
});