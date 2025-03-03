import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

import { leadSchema } from "@/types/lead";
import { Button } from "../ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useMutation } from "graphql-hooks";
import { leadMutation } from "@/lib/graphql/lead/mutation";
import { AssignedLeadTableRowActions } from "../User/Lead/assigned-lead-row-action";
import { useToast } from "../ui/use-toast";
import { useEffect } from "react";
import { multiSelectFilter } from "../Table/advance-table/advance-data-table";

export const LeadColDefs: ColumnDef<z.infer<typeof leadSchema>>[] = [
    {
        id: "id",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => {
            return (
                <ViewLeadInfo lead={row.original} />
            )
        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Email',
        accessorKey: 'email',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("email")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    // {
    //     header: 'Phone',
    //     accessorKey: 'phone',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 <span>{row.getValue("phone")}</span>
    //             </div>
    //         )

    //     },
    //     filterFn: multiSelectFilter,
    // },
    // {
    //     header: 'Alternate Phone',
    //     accessorKey: 'alternatePhone',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 <span>{row.getValue("alternatePhone")}</span>
    //             </div>
    //         )

    //     },
    //     filterFn: multiSelectFilter,
    // },
    {
        header: 'Assigned',
        accessorKey: '',
        cell: ({ row }) => {
            const rowData = row?.original;
            return (
                <AssigneeName lead={rowData} />
            );
        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Created By',
        accessorKey: 'via',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("via")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Created At',
        accessorKey: 'createdAt',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("createdAt")}</span>
                    </div>
            )

        },
        filterFn: multiSelectFilter,
    },
];

const AssigneeName = ({ lead }: { lead: any }) => {
    const assigneeName = lead?.leadMember?.map((leadMember: any) => leadMember?.member?.name).join(", ");
    return (
        <Button
            size={'sm'}
            variant={assigneeName ? "secondary" : "destructive"}
            className="text-xs p-2  capitalize"
        >
            {!!assigneeName ? assigneeName : "Not Assigned"}
        </Button>
    )
}

export const RootProspectColDefs: ColumnDef<z.infer<typeof leadSchema>>[] = [
    {
        id: "id",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => {
            return (
                <ViewProspectInfo prospect={row.original} />
            )
        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Email',
        accessorKey: 'email',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("email")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    // {
    //     header: 'Phone',
    //     accessorKey: 'phone',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 <span>{row.getValue("phone")}</span>
    //             </div>
    //         )

    //     },
    //     filterFn: multiSelectFilter,
    // },
    // {
    //     header: 'Department',
    //     accessorKey: 'dept',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 {/* <span>{row.getValue("dept")}</span> */}
    //                 <span>Sales</span>
    //             </div>
    //         )
    //     }
    // },
    // {
    //     header: 'Alternate Phone',
    //     accessorKey: 'alternatePhone',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 <span>{row.getValue("alternatePhone")}</span>
    //             </div>
    //         )

    //     },
    //     filterFn: multiSelectFilter,
    // },
    {
        header: 'Created By',
        accessorKey: 'via',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("via")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Created At',
        accessorKey: 'createdAt',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("createdAt")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
];

export const ProspectColDefs: ColumnDef<z.infer<typeof leadSchema>>[] = [
    {
        id: "id",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => {
            return (
                <ViewLeadInfo lead={row.original} />
            )
        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Email',
        accessorKey: 'email',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("email")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Phone',
        accessorKey: 'phone',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("phone")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    // {
    //     header: 'Department',
    //     accessorKey: 'dept',
    //     cell: ({ row }) => {
    //         return (
    //             <div className="flex items-center">
    //                 {/* <span>{row.getValue("dept")}</span> */}
    //                 <span>Sales</span>
    //             </div>
    //         )
    //     }
    // },
    {
        header: 'Alternate Phone',
        accessorKey: 'alternatePhone',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <span>{row.getValue("alternatePhone")}</span>
                </div>
            )

        },
        filterFn: multiSelectFilter,
    },
    {
        header: 'Action',
        accessorKey: '',
        cell: ({ row }) => {
            return (
                <AssignedLeadTableRowActions lead={row.original} />
            );
        }
    },
];

const ViewLeadInfo = ({ lead }: { lead: z.infer<typeof leadSchema> }) => {
    const { onOpen } = useModal()

    return (
        <div className="flex items-center">
            <span
                className="text-blue-900 cursor-pointer hover:underline"
                onClick={() => onOpen("viewLeadInfo", { lead })}>{lead.name}</span>
        </div>
    )
}

const ViewProspectInfo = ({ prospect }: { prospect: z.infer<typeof leadSchema> }) => {
    const { onOpen } = useModal()

    return (
        <div className="flex items-center">
            <span
                className="text-blue-900 cursor-pointer hover:underline"
                onClick={() => onOpen("viewProspectInfo", { lead: prospect })}>{prospect.name}</span>
        </div>
    )
}

export const LeadApprovedAction = ({ lead }: { lead: z.infer<typeof leadSchema> }) => {
    const { toast } = useToast()
    const [appvedLead, { loading, data, error }] = useMutation(leadMutation.APPROVED_LEAD_MUTATION)
    useEffect(() => {
        if (data?.appvedLead) {
            toast({
                title: "Transfer Successfully!"
            })
        }
        if (error) {
            toast({
                title: "Error",
                variant: "destructive"
            })

        }
    }, [data, error, toast])

    return (
        <Button
            className="bg-green-700"
            size={'sm'}
            onClick={async (value: any) => await appvedLead({
                variables: {
                    leadId: lead.id,
                    status: true
                }
            })}>
            Transfer
        </Button>
    )
}
