"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import MultipleSelector from "@/components/multi-select-shadcn-expension"
import { useMutation } from "graphql-hooks"
import { companyMutation } from "@/lib/graphql/company/mutation"
import { useCompany } from "@/components/providers/CompanyProvider"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function CategoryModal({ initialData }: any) {
  const [open, setOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const { companyCategories, rootInfo } = useCompany()

  const [updateCompanyCategories] = useMutation(
    companyMutation.UPDATE_COMPANY_CATEGORIES
  )

  // Level 0 state and options
  const [level0Opts, setLevel0Opts] = useState<any[]>([])
  const [sel0, setSel0] = useState("")

  // Level 1 state and options
  const [level1Opts, setLevel1Opts] = useState<any[]>([])
  const [sel1, setSel1] = useState("")

  // Level 2 state and options
  const [level2Opts, setLevel2Opts] = useState<any[]>([])
  const [sel2, setSel2] = useState("")

  // Level 3 state and options
  const [level3Opts, setLevel3Opts] = useState<any[]>([])
  const [sel3, setSel3] = useState("")

  // Tags
  const [tagOpts, setTagOpts] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  // Initialize options and selections
  useEffect(() => {
    setLevel0Opts(
      companyCategories?.categories?.filter((c: any) => c.level === 0)
    )
    setTagOpts(companyCategories.tags || [])

    if (initialData?.categories) {
      const hierarchy: any[] = []
      let ptr = initialData.categories
      while (ptr) {
        hierarchy.unshift(ptr)
        ptr = ptr.parent
      }
      if (hierarchy[0]) setSel0(hierarchy[0].id)
      if (hierarchy[1]) setSel1(hierarchy[1].id)
      if (hierarchy[2]) setSel2(hierarchy[2].id)
      if (hierarchy[3]) setSel3(hierarchy[3].id)
      setTags(initialData.tags || [])
    }
  }, [companyCategories, rootInfo, initialData])

  // Populate dependent levels
  useEffect(() => {
    const p = companyCategories?.categories?.find((c: any) => c.id === sel0)
    setLevel1Opts((p?.children || []).filter((c: any) => c.level === 1))
    setSel1("")
    setLevel2Opts([])
    setSel2("")
    setLevel3Opts([])
    setSel3("")
  }, [sel0, companyCategories])

  useEffect(() => {
    const p = level1Opts.find((c) => c.id === sel1)
    setLevel2Opts((p?.children || []).filter((c: any) => c.level === 2))
    setSel2("")
    setLevel3Opts([])
    setSel3("")
  }, [sel1, level1Opts])

  useEffect(() => {
    const p = level2Opts.find((c) => c.id === sel2)
    setLevel3Opts((p?.children || []).filter((c: any) => c.level === 3))
    setSel3("")
  }, [sel2, level2Opts])

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const path = [
      level0Opts.find((c) => c.id === sel0)?.name || "",
      level1Opts.find((c) => c.id === sel1)?.name || "",
      level2Opts.find((c) => c.id === sel2)?.name || "",
      level3Opts.find((c) => c.id === sel3)?.name || "",
    ]

    updateCompanyCategories({
      variables: {
        companyId: initialData.companyId,
        category: path[0],
        subCategory: path[1],
        subCategory2: path[2],
        subCategory3: path[3],
        tags,
      },
    })
      // .then(() => refetchCompany())
      .catch(console.error)

    setOpen(false)
  }

  // Helper to add new created values
  const handleValueChange = (
    selected: string,
    opts: any[],
    setOpts: React.Dispatch<React.SetStateAction<any[]>>, 
    setSel: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (selected && !opts.find((c) => c.id === selected)) {
      setOpts([...opts, { id: selected, name: selected, children: [] }])
    }
    setSel(selected)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil size={14} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Categories & Tags</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Level 0 */}
          <div className="space-y-2">
            <Label>Category (Level 0)</Label>
            <MultipleSelector
              creatable
              options={level0Opts?.map((c) => ({ value: c.id, label: c.name }))}
              value={
                sel0
                  ? [{ value: sel0, label: level0Opts?.find((c) => c.id === sel0)?.name || '' }]
                  : []
              }
              onChange={(items) => handleValueChange(items[0]?.value || "", level0Opts, setLevel0Opts, setSel0)}
              placeholder="Select or create category"
              hidePlaceholderWhenSelected
              triggerSearchOnFocus
            />
          </div>

          {/* Level 1 */}
          <div className="space-y-2">
            <Label>Sub-Category (Level 1)</Label>            
            <MultipleSelector
              creatable
              options={level1Opts?.map((c) => ({ value: c.id, label: c.name }))}
              value={
                sel1
                  ? [{ value: sel1, label: level1Opts.find((c) => c.id === sel1)?.name }]
                  : []
              }
              onChange={(items) => handleValueChange(items[0]?.value || "", level1Opts, setLevel1Opts, setSel1)}
              placeholder="Select or create sub-category"
              hidePlaceholderWhenSelected
              triggerSearchOnFocus
            />
          </div>

          {/* Level 2 */}
          <div className="space-y-2">
            <Label>Sub-Sub-Category (Level 2)</Label>
            <MultipleSelector
              creatable
              options={level2Opts?.map((c) => ({ value: c.id, label: c.name }))}
              value={
                sel2
                  ? [{ value: sel2, label: level2Opts.find((c) => c.id === sel2)?.name }]
                  : []
              }
              onChange={(items) => handleValueChange(items[0]?.value || "", level2Opts, setLevel2Opts, setSel2)}
              placeholder="Select or create sub-sub-category"
              hidePlaceholderWhenSelected
              triggerSearchOnFocus
            />
          </div>

          {/* Level 3 */}
          <div className="space-y-2">
            <Label>Sub-Sub-Sub-Category (Level 3)</Label>
            <MultipleSelector
              creatable
              options={level3Opts?.map((c) => ({ value: c.id, label: c.name }))}
              value={
                sel3
                  ? [{ value: sel3, label: level3Opts.find((c) => c.id === sel3)?.name || "" }]
                  : []
              }
              onChange={(items) => handleValueChange(items[0]?.value || "", level3Opts, setLevel3Opts, setSel3)}
              placeholder="Select or create sub-sub-sub-category"
              hidePlaceholderWhenSelected
              triggerSearchOnFocus
            />
          </div>

          {/* Tags */}
          <div className="border-t pt-4 space-y-2">
            <Label>Tags</Label>
            <MultipleSelector
              creatable
              options={tagOpts?.map((t) => ({ value: t, label: t }))}
              value={tags.map((t) => ({ value: t, label: t }))}
              onChange={(items) => setTags(items.map((i) => i.value))}
              placeholder="Select or create tags"
              hidePlaceholderWhenSelected
              triggerSearchOnFocus
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
