"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createUpdateMemberSchema } from "@/types/auth"

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
import { CREATE_OR_UPDATE_MANAGER, LOGIN_USER, UPDATE_USER_COMPANY } from "@/lib/graphql/user/mutations"
import { userQueries } from "@/lib/graphql/user/queries"
import { userAtom } from "@/lib/atom/userAtom"
import { useAtomValue } from "jotai"
import { deptQueries } from "@/lib/graphql/dept/queries"
import { companyDeptSchema } from "@/types/company"
import { companyQueries } from "@/lib/graphql/company/queries"
import { useCompany } from "@/components/providers/CompanyProvider"
import { useEffect } from "react"

export const UpdateMember = ({ userId }: { userId: string }) => {

    const { toast } = useToast()
    const user = useAtomValue(userAtom)
    const { companyDeptMembers } = useCompany()
    const [UpdateUser, { loading, error, data }] = useMutation(UPDATE_USER_COMPANY);

    const { loading: deptLoading, error: deptError, data: deptData } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
        variables: { companyId: user?.companyId },
        skip: !user?.token || !user?.companyId,
        refetchAfterMutations: [
            {
                mutation: LOGIN_USER
            },
        ],
    });

    const { loading: roleLoading, error: roleError, data: rolesData } = useQuery(userQueries.GET_ROLES, {
        variables: { companyId: user?.companyId },
        skip: !user?.companyId
    });


    const form = useForm<z.infer<typeof createUpdateMemberSchema>>({
        resolver: zodResolver(createUpdateMemberSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            deptId: "",

        },
    })

    const member = companyDeptMembers?.find((member) => member.id === userId)
    useEffect(() => {
        if (member) {
            form.setValue("name", member.name)
            form.setValue("email", member.email)
            form.setValue("phone", member.phone)
            form.setValue("deptId", member.deptId)
        }
    }, [companyDeptMembers, form, member])

    const onSubmit = async (data: z.infer<typeof createUpdateMemberSchema>) => {
        const { error, data: newResData } = await UpdateUser({
            variables: {
                updateUserInput: {
                    name: data.name,
                    email: data.email,
                    roleId: data.roleId,
                    phone: member?.phone || "",
                    deptId: data.deptId,
                }
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
            title: "Update Successfully!",
        })
    }

    return (
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
                            disabled={true}
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
                                                <SelectValue placeholder={"Select Role"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent
                                            className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"

                                        >
                                            {
                                                rolesData?.getRoles?.map((role: any) => (
                                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
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
                <Button type="submit" className="mt-6">Update Member</Button>
            </form>
        </Form>
    )
}