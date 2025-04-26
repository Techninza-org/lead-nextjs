"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import MultipleSelector from "@/components/multi-select-shadcn-expension"

export function CompanyFuncTagModal({ initialData }: any) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialData || {})
  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [customTags, setCustomTags] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedTags(initialData.tags || [])
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleAddCustomTag = () => {
    if (newTag && !selectedTags.includes(newTag) && !customTags.includes(newTag)) {
      setCustomTags((prev) => [...prev, newTag])
      setSelectedTags((prev) => [...prev, newTag])
      setNewTag("")
    }
  }

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag))
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedData = {
      ...formData,
      tags: selectedTags,
    }
    setOpen(false)
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
          <DialogTitle>Edit Funtion Tags</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4">

            <div className="border-t pt-3">
              <Label className="text-sm mb-2 block">Tags</Label>
              <div className="flex gap-2">
                <MultipleSelector
                  value={selectedTags.map((tag) => ({ value: tag, label: tag }))}
                  onChange={(values) => setSelectedTags(values.map((v) => v.value))}
                  badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                  options={
                    initialData?.tags?.map((tag: string) => ({
                      value: tag,
                      label: tag,
                    })) || []
                  }
                  placeholder="Select Tags"
                  emptyIndicator={
                    <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">No Tags found.</p>
                  }
                  hidePlaceholderWhenSelected
                  triggerSearchOnFocus
                  creatable
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
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
