import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import HoverCardToolTip from "@/components/hover-card-tooltip";
import Link from "next/link";
import { CategoryModal } from "./company/category-modal";
import { Button } from "@/components/ui/button";

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
            return (
                <div className="flex items-center">
                    <Link href={`/admin/dept/${id}`} className="ml-2 text-blue-800">
                        <span>{id}</span>
                    </ Link >
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
        id: "actions",
        cell: ({ row }) => {
            const company = row.original
            return (
                <CategoryModal
                    companyId={company.id}
                    initialData={{categories : row.original.categories, tags: row.original.tags}}
                    onSuccess={() => {
                        // Refresh your data here
                    }}
                />
            )
        }
    }

];
