"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createCompanyMemberSchema } from "@/types/auth"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQuery } from "graphql-hooks"
import { ADD_COMPANY_MEMBER, LOGIN_USER } from "@/lib/graphql/user/mutations"
import { userAtom } from "@/lib/atom/userAtom"
import { useAtomValue } from "jotai"
import { deptQueries } from "@/lib/graphql/dept/queries"
import { companyDeptSchema } from "@/types/company"
import { companyQueries } from "@/lib/graphql/company/queries"
import { useModal } from "@/hooks/use-modal-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { useState } from "react"
import { useCompany } from "../providers/CompanyProvider"

export const AssignMemberModal = () => {
    const { roles: filteredRoles } = useCompany() //companyMemberRoles changed this
    const { toast } = useToast()
    const user = useAtomValue(userAtom)
    const [addCompanyMember, { loading, error, data }] = useMutation(ADD_COMPANY_MEMBER);
    const { isOpen, onClose, type } = useModal();
    const isModalOpen = isOpen && type === "addMember";

    const { loading: deptLoading, error: deptError, data: deptData } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
        variables: { companyId: user?.companyId },
        skip: !user?.token || !user?.companyId,
        refetchAfterMutations: [
            {
                mutation: LOGIN_USER
            },
        ],
    });



    const form = useForm<z.infer<typeof createCompanyMemberSchema>>({
        resolver: zodResolver(createCompanyMemberSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            deptId: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof createCompanyMemberSchema>) => {
        const { error, data: newResData } = await addCompanyMember({
            variables: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: `${data.name}@123`,
                roleId: data.roleId,
                deptId: data.deptId,
                companyId: user?.companyId
            }
        });

        if (error) {
            const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ")
            toast({
                title: 'Error',
                description: message || "Something went wrong",
                variant: "destructive"
            })
            return;
        }

        toast({
            variant: "default",
            title: "Member Added Successfully!",
        })

        // toast({
        //     variant: "default",
        //     title: "Note",
        //     description: `Password: ${data.name}@123 is set to default, please ask the user to change it`,
        // })
        if (!error) {
            handleClose();
        }
    }

    const handleClose = () => {
        form.reset();
        onClose();
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-sm">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Add New Member
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder="Name"
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder="Email"
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">Phone</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    placeholder="Enter Phone"
                                                    {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </div>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="deptId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                    >
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent
                                                    className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                                >
                                                    {
                                                        deptData?.getCompanyDepts?.map((dept: z.infer<typeof companyDeptSchema>) => (
                                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>

                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="roleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"

                                                    >
                                                        <SelectValue placeholder="Select Member Role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent
                                                    className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"

                                                >
                                                    {
                                                        filteredRoles?.map((role: any) => (
                                                            <SelectItem key={role.id} value={role.id} className="capitalize">{role.name}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="mt-6">Register Member</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}