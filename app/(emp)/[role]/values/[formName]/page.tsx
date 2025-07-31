"use client"
import AdvancedDataTable from "@/components/Table/advance-table/advance-data-table";
import { useCompany } from "@/components/providers/CompanyProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal-store";
import { companyQueries } from "@/lib/graphql/company/queries";
import { updateDependentFields } from "@/lib/utils";
import { useQuery } from "graphql-hooks";
import { PlusCircleIcon } from "lucide-react";
import { useCallback, useMemo } from "react";

export default function Page({ params }: { params: { formName: string } }) {
    const formName = decodeURIComponent(params?.formName);
    const { data, loading, error } = useQuery(companyQueries.GET_SUBMITTED_FORM_VALUE, {
        variables: {
            formName,
        }
    })
    const formData = data?.getFormValuesByFormName;
    const { onOpen } = useModal()
    const { companyDeptFields } = useCompany()

    const formateForms = updateDependentFields(companyDeptFields || [])
    const formateFields = useMemo(() => formateForms?.find((x: any) => x.name === formName) || [], [formateForms, formName])

    const MoreInfoLead = useCallback(({ selectedLeads }: { selectedLeads: any[] }) => {
        return (
            <div className="flex gap-2 ml-auto">
                <Button
                    onClick={() => onOpen("submitLead", { fields: formateFields })}
                    variant={'default'}
                    size={"sm"}
                    className="items-center gap-1">
                    <PlusCircleIcon size={15} /> <span>Add New {formName}</span>
                </Button>
            </div>
        )
    }, [formName, formateFields, onOpen])

    return (
        <Card className="w-full max-w-3xl mx-auto my-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">{formName}</CardTitle>
            </CardHeader>
            <CardContent>
                <AdvancedDataTable
                    dependentCols={[]}
                    columnNames={Object.keys(formData?.[0] || {})}
                    data={formData || []}
                    tableName={formName}
                    MoreInfo={MoreInfoLead}
                />
            </CardContent>
        </Card>
    )
}