import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import HoverCardToolTip from "@/components/hover-card-tooltip";
import Link from "next/link";
import { CategoryModal } from "./company/category-modal";
import { Button } from "@/components/ui/button";
import { CompanyFuncTagModal } from "./company/company-func-tag-modal";
import { useModal } from "@/hooks/use-modal-store";
import { Settings, Settings2 } from "lucide-react";

export function getCategoryNames(category: any) {
    const categories = []

    let current = category
    while (current) {
        categories.push({ name: current.name, level: current.level ?? 0 })
        current = current.parent
    }
    categories.sort((a, b) => a.level - b.level)
    return categories.map(cat => cat.name)
}

export const CompaniesListCol: ColumnDef<z.infer<any>>[] = [
    {
        header: 'Root Id',
        cell: ({ row }) => {
            const id = row.original.rootId;
            const orgId = row.original.orgId
            return (
                <div className="flex items-center">
                    <Link href={`/admin/companies/${orgId}`} className="ml-2 text-blue-800">
                        <span>{id}</span>
                    </Link>
                </div>
            )
        }
    },
    {
        header: 'Company Name',
        cell: ({ row }) => {
            const id = row.original.name;
            return (
                <span>{id}</span>
            )
        }
    },
    {
        header: 'Owner User',
        accessorKey: 'name',
        cell: ({ row }) => {
            return (
                <span>{row.getValue("name")}</span>
            )

        }
    },
    {
        header: 'Details',
        cell: ({ row }) => {
            const email = row.original.email
            const phone = row.original.phone
            return (
                <HoverCardToolTip label="Details" >
                    <p>Email: {email}</p>
                    <p>Phone: {phone}</p>
                </HoverCardToolTip>
            )
        }
    },
    {
        header: 'Tags',
        accessorKey: 'tags',
        cell: ({ row }) => {
            const categorires = (row.original.categories)
            const categories = getCategoryNames(categorires)
            return (
                <p>
                    {[...categories, ...row.getValue("tags")]
                        // .sort((a, b) => {
                        //     const levelA = a?.level ?? 99 // If undefined, push to end
                        //     const levelB = b?.level ?? 99
                        //     return levelA - levelB
                        // })
                        .map((x, index) => (
                            <Button key={index} size="sm" className="mx-1" variant="secondary">
                                {x?.name || x} {/* Show name if available, fallback to raw value */}
                            </Button>
                        ))}
                </p>
            )
        }
    },
    {
        header: 'Other Settings',
        cell: ({ row }) => {
            return (
                <CompanySettings row={row.original} />
            )

        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const company = row.original
            return (
                <CategoryModal
                    companyId={company.id}
                    initialData={{ categories: row.original.categories, tags: row.original.tags }}
                    onSuccess={() => {
                        // Refresh your data here
                    }}
                />
            )
        }
    }

];

export const CompanyFunctionCols: ColumnDef<z.infer<any>>[] = [
    {
        accessorKey: "functionName",
        header: 'Function Name',
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    {row.getValue("functionName")}
                </div>
            )
        }
    },
    {
        accessorKey: "desc",
        header: 'Description',
        cell: ({ row }) => {
            return (
                <span>{row.getValue("desc")}</span>
            )
        }
    },
    {
        accessorKey: 'viewName',
        header: 'View Name',
        cell: ({ row }) => {
            return (
                <span>{row.getValue("viewName")}</span>
            )

        }
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
            return (
                <span>{row.getValue("tags")}</span>
            )

        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const company = row.original
            return (
                <CompanyFuncTagModal
                    companyId={company.id}
                    initialData={{ categories: row.original.categories, tags: row.original.tags }}
                    onSuccess={() => {
                        // Refresh your data here
                    }}
                />
            )
        }
    }
];

const CompanySettings = ({ row }: any) => {
    const { onOpen } = useModal()
    return (
        <Button variant={'secondary'} className="mx-auto" size={'icon'} onClick={() => onOpen("admin:company:settings", { data: row })}>
            <Settings size={19} />
        </Button>
    )
}
