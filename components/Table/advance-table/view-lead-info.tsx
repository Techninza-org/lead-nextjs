import { useModal } from "@/hooks/use-modal-store"
import type { z } from "zod"
import type { leadSchema } from "@/types/lead"
import { Loader2 } from "lucide-react"
import { useLead } from "@/components/providers/LeadProvider"
import { useState } from "react"

interface ViewLeadInfoProps {
  lead: z.infer<typeof leadSchema>
  changeView: string[]
  tableName: string
}

export const ViewLeadInfo = ({ lead, changeView, tableName }: ViewLeadInfoProps) => {
  const { onOpen } = useModal()
  const { getChildData } = useLead()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      // Open modal immediately with initial lead data
      onOpen("viewLeadInfo", { 
        lead: { ...lead, isLoading: true }, 
        table: { changeView } 
      })

      setIsLoading(true)
      
      // Fetch child data
      const data = await getChildData(tableName, lead._id ?? lead.id)
      
      // Update modal with fetched data
      onOpen("viewLeadInfo", { 
        lead: { ...data.data, isLoading: false }, 
        table: { changeView: data.changeView } 
      })
    } catch (error) {
      console.error("Error fetching child data:", error)
      
      // Update modal to show error state
      onOpen("viewLeadInfo", { 
        lead: { ...lead, isLoading: false, error: true }, 
        table: { changeView } 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-blue-900 ${isLoading ? "cursor-not-allowed" : "cursor-pointer hover:underline"}`}
        onClick={handleClick}
      >
        {lead.name}
      </span>
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin text-blue-900" />
      )}
    </div>
  )
}