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
import { CheckIcon, Edit2Icon, ImageOffIcon, PencilIcon, UserPlus2Icon, X } from "lucide-react";
import { Button } from "../ui/button";
import FollowUpForm from "../Lead/follow-up-form";
import { Fragment, useEffect, useState } from "react";
import FollowUpsData from "../Lead/follow-ups-data";
import { formatCurrencyForIndia, formatReturnOfDB } from "@/lib/utils";
import { LeadApprovedAction } from "../Lead/lead-table-col";
import { Input } from "../ui/input";
import AdvancedDataTable from "../Table/advance-table/advance-data-table";


export const ViewLeadInfoModal = () => {
    const [isFollowUpActive, setIsFollowUpActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { isOpen, onClose, type, data: modalData } = useModal();
    const { lead, table } = modalData;
    const [editingFeedback, setEditingFeedback] = useState<{ [key: string]: boolean }>({})
    const [feedbackValues, setFeedbackValues] = useState<{ [key: string]: string }>({})
    const [editingLead, setEditingLead] = useState<{ [key: string]: boolean }>({
        name: false,
        email: false,
        phone: false,
        address: false,
    })
    const [leadValues, setLeadValues] = useState<any>(lead)

    useEffect(() => {
        setLeadValues(lead)
    }, [lead])


    const isModalOpen = isOpen && lead && type === "viewLeadInfo";

    if (!lead && !table) return
    const handleClose = () => {
        onClose();
    }

    const toggleEdit = (feedbackId: string, value: string) => {
        setEditingFeedback(prev => ({ ...prev, [feedbackId]: !prev[feedbackId] }))
        setFeedbackValues(prev => ({ ...prev, [feedbackId]: value }))
    }

    const handleSave = (feedbackId: string) => {
        // Here you would typically make an API call to update the feedback
        setEditingFeedback(prev => ({ ...prev, [feedbackId]: false }))
    }

    const toggleLeadEdit = (field: any) => {
        setEditingLead(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const handleLeadSave = (field: any) => {
        // onLeadUpdate({ [field]: leadValues[field] })
        setEditingLead(prev => ({ ...prev, [field]: false }))
    }

    const formatCurrencyForIndia = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount)
    }


    const renderEditableField = (field: any, label: string) => (
        <div className="flex justify-between pb-4 items-center">
            <span className="text-sm font-semibold">{label}:</span>
            {editingLead[field] ? (
                <div className="flex items-center">
                    <Input
                        value={leadValues[field] as string}
                        onChange={(e) => setLeadValues((prev: any) => ({ ...prev, [field]: e.target.value }))}
                        className="max-w-[200px] mr-2"
                    />
                    <Button size="icon" onClick={() => handleLeadSave(field)} aria-label={`Save ${label}`}>
                        <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleLeadEdit(field)} aria-label={`Cancel editing ${label}`}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center">
                    <span className="text-sm font-semibold capitalize mr-2">{leadValues?.[field] as string}</span>
                    {isEditing && <Button size="icon" variant="ghost" onClick={() => toggleLeadEdit(field)} aria-label={`Edit ${label}`}>
                        <PencilIcon className="h-4 w-4" />
                    </Button>}
                </div>
            )}
        </div>
    )

    return (

        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-lg max-h-[80%]">
                <DialogHeader className="pt-6">
                    <DialogTitle className="text-2xl font-bold">
                        <div className="flex items-center justify-between">
                            <div>
                                <Badge variant="outline" className="text-xs text-gray-600  font-medium">
                                    ID: {lead?.id || lead?._id }
                                </Badge>
                                <h2 className="pl-2">Lead Details</h2>
                            </div>
                            {/* <div className="flex items-center space-x-4">
                                {
                                    isEditing ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                            aria-label="Save changes (Alt + S)"
                                        >
                                            <Edit2Icon className="mr-2 h-4 w-4" />
                                            Save
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            aria-label="Edit lead information (Alt + S)"
                                        >
                                            <Edit2Icon className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    )
                                }
                            </div> */}
                        </div>
                    </DialogTitle>
                    <Separator className="my-4" />
                </DialogHeader>
                <ScrollArea className="max-h-full w-full rounded-md border">
                    <div className="p-4">
                        {lead && (
                            <div>
                                {table.changeView.map((item: any) => {
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
                            </div>
                        )}

                        {
                            Object.entries(lead?.children || {}).map(([key, value]: any[]) => {
                                console.log(key, value, "key, value")
                                return (
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
                                )
                            })
                        }


                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog >
    )
}