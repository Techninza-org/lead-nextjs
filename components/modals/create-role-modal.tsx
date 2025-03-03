"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useModal } from "@/hooks/use-modal-store"
import { useAtom, useAtomValue } from "jotai"
import { companyDeptMembersAtom, userAtom } from "@/lib/atom/userAtom"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "../ui/use-toast"
import { useMutation } from "graphql-hooks"
import { userQueries } from "@/lib/graphql/user/queries"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

const scheduleSchema = z.object({
    day: z.enum(weekdays),
    fromTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid 24-hour time").nullable(),
    toTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid 24-hour time").nullable(),
})

const formSchema = z.object({
    name: z.string().min(2).max(50),
    type: z.enum(["ADMIN", "GENERAL_MANAGER", "DEPARTMENT_MANAGER", "NON_MANAGER"]),
    department: z.string().optional(),
    isActive: z.boolean(),
    schedule: z.array(scheduleSchema).length(7),
})

type FormValues = z.infer<typeof formSchema>

export const CreateRoleModal = () => {
    const userInfo = useAtomValue(userAtom)
    const [, setCompanyDeptMembers] = useAtom(companyDeptMembersAtom)
    const { isOpen, onClose, type, data: modalData } = useModal()
    const { leads, apiUrl, query: formName } = modalData
    const isModalOpen = isOpen && type === "create:role"
    const { toast } = useToast()
    const [CreateRole] = useMutation(userQueries.CREATE_ROLE)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "NON_MANAGER",
            isActive: true,
            schedule: weekdays.map((day) => ({
                day,
                fromTime: day !== "Saturday" && day !== "Sunday" ? "09:00" : null,
                toTime: day !== "Saturday" && day !== "Sunday" ? "17:00" : null,
            })),
        },
    })

    const roleType = form.watch("type")
    const showDepartment = roleType === "DEPARTMENT_MANAGER" || roleType === "NON_MANAGER"

    async function onSubmit(values: FormValues) {
        try {
            const { schedule, ...rest } = values
            
            // Transform schedule array into database fields
            const scheduleData = schedule.reduce((acc, { day, fromTime, toTime }) => ({
                ...acc,
                [`${day.toLowerCase()}FromTime`]: fromTime,
                [`${day.toLowerCase()}ToTime`]: toTime,
            }), {})

            const newRole = await CreateRole({
                variables: {
                    input: {
                        ...rest,
                        ...scheduleData,
                        companyId: userInfo?.companyId,
                    },
                },
            })

            toast({
                title: "Success",
                description: "Role created successfully",
            })
            form.reset()
            onClose()
        } catch (error) {
            console.error("Error creating role:", error)
            toast({
                title: "Error",
                description: "Failed to create role",
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        form.reset()
        onClose()
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="text-black max-w-screen-md min-h-[620px]">
                <DialogHeader className="pt-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Role
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter role name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="GENERAL_MANAGER">General Manager</SelectItem>
                                            <SelectItem value="DEPARTMENT_MANAGER">Department Manager</SelectItem>
                                            <SelectItem value="NON_MANAGER">Non Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showDepartment && (
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter department" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <FormLabel>Active Hours</FormLabel>
                            <div className="space-y-2">
                                {weekdays.map((day, index) => {
                                    const isActive = Boolean(form.watch(`schedule.${index}.fromTime`))
                                    return (
                                        <div key={day} className="flex items-center gap-4">
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={(checked) => {
                                                    const newValue = checked ? { fromTime: "09:00", toTime: "17:00" } : { fromTime: null, toTime: null }
                                                    form.setValue(`schedule.${index}.fromTime`, newValue.fromTime)
                                                    form.setValue(`schedule.${index}.toTime`, newValue.toTime)
                                                }}
                                            />
                                            <div className="w-32 font-medium">{day}:</div>
                                            <FormField
                                                control={form.control}
                                                name={`schedule.${index}.fromTime`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="time"
                                                                    {...field}
                                                                    value={field.value || ""}
                                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                                    className="pl-10"
                                                                    disabled={!isActive}
                                                                />
                                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="text-muted-foreground">to</div>
                                            <FormField
                                                control={form.control}
                                                name={`schedule.${index}.toTime`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="time"
                                                                    {...field}
                                                                    value={field.value || ""}
                                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                                    className="pl-10"
                                                                    disabled={!isActive}
                                                                />
                                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            Create Role
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}