"use client";
import { useAtom } from "jotai";
import { useQuery } from "graphql-hooks";

import { userAtom } from "@/lib/atom/userAtom";
import { leadQueries } from "@/lib/graphql/lead/queries";

import { AssignedLeadColDefs } from "./assigned-lead-table-col";
import { leadMutation } from "@/lib/graphql/lead/mutation";
import { UserLeadTable } from "./user-lead-table";
import { useState } from "react";
import { PermissionGate } from "@/components/PermissionGate";
import AdvancedDataTable from "@/components/Table/advance-table/advance-data-table";

export const AssignedProspectTable = () => {
    const [userInfo] = useAtom(userAtom);
    const [leadInfo, setAssigneLeads] = useState([])
    const { loading } = useQuery(leadQueries.GET_ASSIGNED_PROSPECT, {
        variables: { userId: userInfo?.id },
        skip: !userInfo?.id,
        onSuccess: ({ data }) => {
            setAssigneLeads(data.getAssignedProspect)
        },
        refetchAfterMutations: [
            {
                mutation: leadMutation.SUBMIT_LEAD
            },
            {
                mutation: leadMutation.SUBMIT_BID_MUTATION
            },
        ]
    });

    if (loading) return (
        <div>Loading...</div>
    )

    return (
        <PermissionGate permissions="VIEW:PROSPECT">
            <AdvancedDataTable data={leadInfo || []} columnNames={Object.keys(leadInfo?.[0] || {})} tableName={'PROSPECT'} />
        </PermissionGate>
    )
}