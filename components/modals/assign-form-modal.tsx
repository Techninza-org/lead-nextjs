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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { useToast } from "@/components/ui/use-toast"
import { useModal } from "@/hooks/use-modal-store"
import { useMutation, useQuery } from "graphql-hooks"
import { useAtomValue } from "jotai"
import { userAtom } from "@/lib/atom/userAtom"
import { Badge } from "../ui/badge"
import { leadMutation } from "@/lib/graphql/lead/mutation"
import { leadQueries } from "@/lib/graphql/lead/queries"
import { Input } from "../ui/input"
import { formatCurrencyForIndia } from "@/lib/utils"
import { companyMutation } from "@/lib/graphql/company/mutation"
import MultipleSelector from "../multi-select-shadcn-expension"
import { useCompany } from "../providers/CompanyProvider"

const assignFormSchema = z.object({
    roleId: z.string().min(1, "Role is required."),
    formIds: z.array(z.string()),
});

export const AssignFormModal = () => {

    const userInfo = useAtomValue(userAtom)
    const { companyDeptFields, companyMemberRoles } = useCompany()

    const { isOpen, onClose, type, data: modalData } = useModal();

    const isModalOpen = isOpen && type === "assignForm";

    const [upsertCompanyDeptForm] = useMutation(companyMutation.UPDATE_ROLE_FORM);

    const { toast } = useToast()

    const form = useForm<z.infer<typeof assignFormSchema>>({
        resolver: zodResolver(assignFormSchema),
    })

    const isLoading = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof assignFormSchema>) => {

        const { error } = await upsertCompanyDeptForm({
            variables: {
                roleId: data.roleId,
                formIds: data.formIds
            }
        })

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
            title: "Form Assigned Successfully!",
        })
        handleClose();
    }

    const handleClose = () => {
        form.reset();
        onClose();
    }

    const companyForm = (companyDeptFields || []).map((field: any) => ({
        label: field.name,
        value: field.id
    }))

    const companyRoles = (companyMemberRoles || []).map((role: any) => ({
        label: role.name,
        value: role.id
    }))

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-md min-h-[420px]">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Assign Form
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="roleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <MultipleSelector
                                            onChange={(value: any) => {
                                                form.setValue("roleId", value?.[0]?.value)
                                            }}
                                            options={companyRoles}
                                            badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                                            placeholder="Select Role..."
                                            hidePlaceholderWhenSelected
                                            maxSelected={1}
                                            triggerSearchOnFocus
                                            emptyIndicator={
                                                <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                                                    no results found.
                                                </p>
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* <FormField
                            control={form.control}
                            name="formIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Forms</FormLabel>
                                    <FormControl>
                                        <MultipleSelector
                                            onChange={(value: any) => {
                                                const formIds = value.map((v: any) => v.value)
                                                form.setValue("formIds", formIds)
                                            }}
                                            options={companyForm}
                                            badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                                            placeholder="Select forms..."
                                            emptyIndicator={
                                                <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                                                    no results found.
                                                </p>
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}
                        {/* <CommandDialog open={open} onOpenChange={setOpen}>
                            <CommandInput placeholder="Enter ..." />
                            <CommandList>
                                <CommandEmpty>
                                    No Results found
                                </CommandEmpty>
                                {data.map(({ label, type, data }) => {
                                    if (!data?.length) return null;

                                    return (
                                        <CommandGroup key={label} heading={label}>
                                            {data?.map(({ id, icon, name, subBadgeText, badgeInfo }) => {
                                                return (
                                                    <CommandItem className="space-x-3" key={id} onSelect={() => onClick({ id, type })}>
                                                        {icon}
                                                        <span>{name}</span>
                                                        <Badge variant={(badgeInfo?.variant || "secondary")}>{badgeInfo?.text}</Badge>
                                                        {subBadgeText && <Badge variant={'secondary'}>{subBadgeText}</Badge>}
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    )
                                })}
                            </CommandList>
                        </CommandDialog> */}
                        <Button
                            type="submit"
                            className="mt-6"
                            disabled={isLoading}
                        >Submit</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}