"use client";
import { useAtomValue } from "jotai";

import { prospects } from "@/lib/atom/leadAtom";

import { RootProspectColDefs } from "./lead-table-col";
import { Button } from "../ui/button";
import { PlusCircle, UploadIcon } from "lucide-react";
import { useCompany } from "../providers/CompanyProvider";
import { useModal } from "@/hooks/use-modal-store";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AdvancedDataTable from "../Table/advance-table/advance-data-table";
import { leadMutation } from "@/lib/graphql/lead/mutation";

export const ProspectTable = () => {
    const { onOpen } = useModal()
    const { optForms } = useCompany()
    const prospectInfo = useAtomValue(prospects)

    const colsName = [
        'name',
        'email',
        'phone',
        'alternatePhone',
    ]
    const addProspectForm = optForms?.find((x: any) => x.name === "Prospect")

    const MoreInfoProspect = ({ selectedLeads }: { selectedLeads: any[] }) => {

        return (
            <div className="flex gap-2 ml-auto">
                <Button
                    // @ts-ignore
                    onClick={() => onOpen("assignLead", { leads: selectedLeads, apiUrl: leadMutation.PROSPECT_ASSIGN_TO, query: "Prospect" })}
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
                            onClick={() => onOpen("uploadPrspectModal", { fields: addProspectForm })}
                        >
                            <UploadIcon size={15} /> <span>Upload Prospects</span>
                        </Button>
                    </label>
                </div>
                <Button
                    onClick={() => onOpen("addProspect", { fields: addProspectForm })}
                    variant={'default'}
                    size={"sm"}
                    className="items-center gap-1">
                    <PlusCircle size={15} /> <span>Add New Prospect</span>
                </Button>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between font-bold">
                    Prospects
                </CardTitle>
            </CardHeader>
            <CardContent>
                <AdvancedDataTable
                    leadProspectCols={RootProspectColDefs}
                    columnNames={colsName}
                    data={prospectInfo as any || []}
                    MoreInfo={MoreInfoProspect}
                />
            </CardContent>
        </Card >
    )
}