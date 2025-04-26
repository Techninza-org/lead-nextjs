"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useModal } from "@/hooks/use-modal-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMutation, useQuery } from "graphql-hooks"

// GraphQL queries and mutations
const GET_COMPANY_SETTINGS = `
  query GetCompanySettings($companyId: String!) {
    getCompanySettings(companyId: $companyId)
  }
`

const UPDATE_COMPANY_SETTINGS = `
  mutation UpdateCompanySettings($companyId: String!, $settings: JSON!) {
    updateCompanySettings(companyId: $companyId, settings: $settings)
  }
`

const companySettingsSchema = z.object({
  actionButton: z.boolean().default(false),
  pageSize: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .default("10"),
})

export const CompanySettingsModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const companyId = data?.data?.rootCompanyId || ""
  const isModalOpen = isOpen && type === "admin:company:settings"
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  console.log(companyId , "companyId")
  // GraphQL query to fetch company settings
  const {
    data: settingsData,
    loading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery(GET_COMPANY_SETTINGS, {
    variables: { companyId },
    skip: !isModalOpen || !companyId,
  })

  // GraphQL mutations
  const [updateSettings] = useMutation(UPDATE_COMPANY_SETTINGS)

  // Form setup
  const form = useForm<z.infer<typeof companySettingsSchema>>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      actionButton: false,
      pageSize: "10",
    },
  })

  // Update form values when settings data is fetched
  useEffect(() => {
    if (settingsData?.getCompanySettings && isModalOpen) {
      const settings = settingsData.getCompanySettings;
      
      // Map the backend response fields to our form fields
      form.setValue("actionButton", settings.isActionEnable || false);
      form.setValue("pageSize", String(settings.pageSize || 10));
    }
  }, [settingsData, form, isModalOpen])

  const onSubmit = async (formData: z.infer<typeof companySettingsSchema>) => {
    if (!companyId) return

    try {
      setIsLoading(true)

      // Update company settings
      await updateSettings({
        variables: {
          companyId,
          settings: {
            orgId: companyId,
            isActionEnable: formData.actionButton,
            pageSize: formData.pageSize,
          },
        },
      })

      // Refetch data to ensure UI is up to date
      await refetchSettings();

      toast({
        variant: "default",
        title: "Settings Updated Successfully!",
      })

      handleClose()
    } catch (error) {
      console.error("Failed to update settings:", error)
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const isLoaded = !settingsLoading

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="text-black max-w-md">
        <DialogHeader className="pt-6">
          <DialogTitle className="text-2xl text-center font-bold">Company Settings</DialogTitle>
        </DialogHeader>

        {!isLoaded ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="space-y-6">
              {/* Action Button Setting */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="actionButton" className="flex flex-col space-y-1">
                  <span>Action Button</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable action buttons in the application interface.
                  </span>
                </Label>
                <Switch
                  id="actionButton"
                  checked={form.watch("actionButton")}
                  onCheckedChange={(checked) => form.setValue("actionButton", checked)}
                />
              </div>

              {/* Page Size Setting */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="pageSize" className="text-gray-700 font-medium">
                    Page size
                  </Label>
                  <span className="text-gray-400 text-sm">@default: 10</span>
                </div>
                <Input
                  id="pageSize"
                  value={form.watch("pageSize")}
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Page Size"
                  onChange={(e) => form.setValue("pageSize", e.target.value)}
                  className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit" variant="default" className="w-full" disabled={isLoading || !companyId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}