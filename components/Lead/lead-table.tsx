
"use client";
import { useAtom } from "jotai";

import { leads } from "@/lib/atom/leadAtom";

import { Button } from "../ui/button";
import { PlusCircle, Upload, UploadIcon } from "lucide-react";
import { useCompany } from "../providers/CompanyProvider";
import { useModal } from "@/hooks/use-modal-store";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { leadMutation } from "@/lib/graphql/lead/mutation";
import AdvanceDataTable from "../Table/advance-table";

export const LeadTable = () => {
    const { onOpen } = useModal()
    const [leadInfo]: any = useAtom(leads)
    const colsName = [
        'name',
        'email',
        // 'phone',
        // 'alternatePhone',
    ]
    const addLeadForm = useCompany().optForms?.find((x: any) => x.name === "Lead")

    const MoreInfoLead = ({ selectedLeads }: { selectedLeads: any[] }) => {
        return (
            <div className="flex gap-2 ml-auto">
                <Button
                    onClick={() => onOpen("assignLead", { leads: selectedLeads, apiUrl: leadMutation.LEAD_ASSIGN_TO, query: "Lead" })}
                    variant={'default'}
                    size={"sm"}
                    className="items-center gap-1"
                    disabled={!selectedLeads.length}
                >
                    Assign Lead
                </Button>
                <div>
                    <label htmlFor="csv-upload">
                        <Button
                            variant="default"
                            color="primary"
                            size={"sm"}
                            className="items-center gap-1"
                            onClick={() => onOpen("uploadLeadModal", { fields: addLeadForm })}
                        >
                            <UploadIcon size={15} /> <span>Upload Lead</span>

                        </Button>
                    </label>
                </div>
                <Button
                    onClick={() => onOpen("addLead", { fields: addLeadForm })}
                    variant={'default'}
                    size={"sm"}
                    className="items-center gap-1">
                    <PlusCircle size={15} /> <span>Add New Lead</span>
                </Button>
            </div>
        )
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between font-bold">
                    Leads------
                </CardTitle>
            </CardHeader>
            <CardContent>
                <AdvanceDataTable
                    filterOption={leadInfo?.filterOptions || {}}
                    optOutFields={leadInfo?.optOutFields || []}
                    changeView={leadInfo?.changeView}
                    columnNames={leadInfo?.listView}
                    data={leadInfo?.data as any || []}
                    MoreInfo={MoreInfoLead}
                    tableName="Lead"
                    pagination={leadInfo?.pagination}
                />
            </CardContent>
        </Card >
    )
}