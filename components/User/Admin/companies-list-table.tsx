"use client";
import { RootTable } from "./root-table";
import { CompaniesListCol } from "./companies-list-col";
import { useCompany } from "@/components/providers/CompanyProvider";

export const CompaniesListTable = () => {
    const { rootInfo, companyCategories } = useCompany()

    return (
        <RootTable columns={CompaniesListCol} data={rootInfo ?? []} categories={companyCategories || []}  />
    )
}