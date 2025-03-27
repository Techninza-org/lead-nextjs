"use client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area"
import { useModal } from "@/hooks/use-modal-store"
import { Separator } from "../ui/separator";
import Image from "next/image";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { CheckIcon, Edit2Icon, ImageOffIcon, Loader2, PencilIcon, UserPlus2Icon, X } from "lucide-react";
import { Button } from "../ui/button";
import FollowUpForm from "../Lead/follow-up-form";
import { Fragment, useEffect, useState } from "react";
import FollowUpsData from "../Lead/follow-ups-data";
import { formatCurrencyForIndia, formatReturnOfDB } from "@/lib/utils";
import { LeadApprovedAction } from "../Lead/lead-table-col";
import { Input } from "../ui/input";
import AdvancedDataTable from "../Table/advance-table/advance-data-table";


export const ViewLeadInfoModal = () => {
    const { isOpen, onClose, type, data: modalData } = useModal();
    const { lead, table } = modalData;

    const isModalOpen = isOpen && lead && type === "viewLeadInfo";

    if (!lead && !table) return null;

    const handleClose = () => {
        onClose();
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-lg max-h-[80%]">
                <DialogHeader className="pt-6">
                    <DialogTitle className="text-2xl font-bold">
                        <div className="flex items-center justify-between">
                            <div>
                                <Badge variant="outline" className="text-xs text-gray-600 font-medium">
                                    ID: {lead?.id || lead?._id}
                                </Badge>
                                <h2 className="pl-2">Lead Details</h2>
                            </div>
                        </div>
                    </DialogTitle>
                    <Separator className="my-4" />
                </DialogHeader>
                
                {lead?.isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                    </div>
                ) : lead?.error ? (
                    <div className="flex justify-center items-center h-full text-red-500">
                        Failed to load lead details
                    </div>
                ) : (
                    <ScrollArea className="max-h-full w-full rounded-md border">
                        <div className="p-4">
                            {/* Existing modal content */}
                            {table?.changeView?.map((item: any) => {
                                const isId = item == "id" ? "_id" : item
                                return (
                                    <div key={item} className="flex justify-between pb-4 items-center">
                                        <span className="text-sm font-semibold capitalize">{item}</span>
                                        <div className="flex items-center">
                                            <span className="text-sm font-semibold capitalize mr-2">{lead?.[isId] as string}</span>
                                        </div>
                                    </div>
                                )
                            })}

                            {Object.entries(lead?.children || {}).map(([key, value]: any[]) => (
                                <Fragment key={key}>
                                    <h3 className="font-medium text-xl pl-2 pt-2 capitalize">{key}</h3>
                                    <Separator className="my-2" />
                                    <AdvancedDataTable
                                        columnNames={Object.keys(value?.[0] || {})}
                                        dependentCols={[]}
                                        data={Array.isArray(value) ? value : []}
                                        showTools={false}
                                        tableName={key}
                                    />
                                </Fragment>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    )
}