import { useModal } from "@/hooks/use-modal-store"
import type { z } from "zod"
import type { leadSchema } from "@/types/lead"

interface ViewLeadInfoProps {
  lead: z.infer<typeof leadSchema>
  changeView: string[]
}

export const ViewLeadInfo = ({ lead, changeView }: ViewLeadInfoProps) => {
  const { onOpen } = useModal()

  return (
    <div className="flex items-center">
      <span 
        className="text-blue-900 cursor-pointer hover:underline" 
        onClick={() => onOpen("viewLeadInfo", { lead, table: { changeView } })}
      >
        {lead.name}
      </span>
    </div>
  )
}