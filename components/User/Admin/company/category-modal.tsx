"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Pencil, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import MultipleSelector from "@/components/multi-select-shadcn-expension"

// Sample data based on the provided response
const initialData = {
  id: "67c12fe7b77813b908732c84",
  orgId: "Lead-Backend",
  rootId: "67644a79bd3b295e0dbdb220",
  name: "Form Exist",
  email: "aloksharma10969@gmail.com",
  phone: "7011609262",
  categoryId: "67e7d6ffe7f32c617e121668",
  tags: ["S3-3", "S2-2", "S2", "C1", "T4-1", "T4-2"],
  isSubscribed: false,
  createdAt: "2025-02-28T03:10:22.698Z",
  updatedAt: "2025-03-29T11:18:24.102Z",
  categories: {
    id: "67e7d6ffe7f32c617e121668",
    name: "S3-3",
    level: 3,
    parentId: "67e7d6ffe7f32c617e121667",
    parent: {
      id: "67e7d6ffe7f32c617e121667",
      name: "S2-2",
      level: 2,
      parentId: "67e7d6ffe7f32c617e121666",
      parent: {
        id: "67e7d6ffe7f32c617e121666",
        name: "S2",
        level: 1,
        parentId: "67e7d6ffe7f32c617e121665",
        parent: {
          id: "67e7d6ffe7f32c617e121665",
          name: "C1",
          level: 0,
          parentId: null,
        },
      },
    },
  },
}

// Available categories
const categories = [{ id: "67e7d6ffe7f32c617e121665", name: "C1", level: 0, parentId: null }]

const subCategories = [{ id: "67e7d6ffe7f32c617e121666", name: "S2", level: 1, parentId: "67e7d6ffe7f32c617e121665" }]

const subSubCategories = [
  { id: "67e7d6ffe7f32c617e121667", name: "S2-2", level: 2, parentId: "67e7d6ffe7f32c617e121666" },
]

const subSubSubCategories = [
  { id: "67e7d6ffe7f32c617e121668", name: "S3-3", level: 3, parentId: "67e7d6ffe7f32c617e121667" },
]

// Available tags
const availableTags = ["S3-3", "S2-2", "S2", "C1", "T4-1", "T4-2", "T4-3", "T5-1", "T5-2"]

export function CategoryModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)

  // Category selection state
  const [categoryMode, setCategoryMode] = useState<"select" | "create">("select")
  const [subCategoryMode, setSubCategoryMode] = useState<"select" | "create">("select")
  const [subSubCategoryMode, setSubSubCategoryMode] = useState<"select" | "create">("select")
  const [subSubSubCategoryMode, setSubSubSubCategoryMode] = useState<"select" | "create">("select")

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "")
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategories[0]?.id || "")
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState(subSubCategories[0]?.id || "")
  const [selectedSubSubSubCategory, setSelectedSubSubSubCategory] = useState(subSubSubCategories[0]?.id || "")

  const [newCategory, setNewCategory] = useState("")
  const [newSubCategory, setNewSubCategory] = useState("")
  const [newSubSubCategory, setNewSubSubCategory] = useState("")
  const [newSubSubSubCategory, setNewSubSubSubCategory] = useState("")

  // Tags state
  const [selectedTags, setSelectedTags] = useState(initialData.tags)
  const [newTag, setNewTag] = useState("")
  const [customTags, setCustomTags] = useState<string[]>([])

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
    if (newTag && !availableTags.includes(newTag) && !customTags.includes(newTag)) {
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

    // Prepare the category data
    let finalCategoryId = ""
    let categoryData = null

    if (subSubSubCategoryMode === "select" && selectedSubSubSubCategory) {
      finalCategoryId = selectedSubSubSubCategory
    } else if (subSubSubCategoryMode === "create" && newSubSubSubCategory) {
      // Create new level 3 category
      finalCategoryId = `new-l3-${Date.now()}`
      categoryData = {
        id: finalCategoryId,
        name: newSubSubSubCategory,
        level: 3,
        parentId: subSubCategoryMode === "select" ? selectedSubSubCategory : `new-l2-${Date.now()}`,
      }
    } else if (subSubCategoryMode === "select" && selectedSubSubCategory) {
      finalCategoryId = selectedSubSubCategory
    } else if (subSubCategoryMode === "create" && newSubSubCategory) {
      // Create new level 2 category
      finalCategoryId = `new-l2-${Date.now()}`
      categoryData = {
        id: finalCategoryId,
        name: newSubSubCategory,
        level: 2,
        parentId: subCategoryMode === "select" ? selectedSubCategory : `new-l1-${Date.now()}`,
      }
    } else if (subCategoryMode === "select" && selectedSubCategory) {
      finalCategoryId = selectedSubCategory
    } else if (subCategoryMode === "create" && newSubCategory) {
      // Create new level 1 category
      finalCategoryId = `new-l1-${Date.now()}`
      categoryData = {
        id: finalCategoryId,
        name: newSubCategory,
        level: 1,
        parentId: categoryMode === "select" ? selectedCategory : `new-l0-${Date.now()}`,
      }
    } else if (categoryMode === "select" && selectedCategory) {
      finalCategoryId = selectedCategory
    } else if (categoryMode === "create" && newCategory) {
      // Create new level 0 category
      finalCategoryId = `new-l0-${Date.now()}`
      categoryData = {
        id: finalCategoryId,
        name: newCategory,
        level: 0,
        parentId: null,
      }
    }

    // Prepare the updated data
    const updatedData = {
      ...formData,
      tags: selectedTags,
      categoryId: finalCategoryId,
      newCategory: categoryData,
      customTags: customTags,
    }

    console.log("Form submitted:", updatedData)
    // Here you would typically send the data to your backend

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Pencil size={14}/></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4">

            <div className="space-y-4">
              <Label>Category Hierarchy</Label>

              <div className="grid grid-cols-1 gap-4">
                {/* Level 0 - Category */}

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category (Level 0)
                  </Label>

                  <MultipleSelector
                    value={selectedCategory ? [{ label: categories.find(cat => cat.id === selectedCategory)?.name || "", value: selectedCategory }] : []}
                    onChange={(value) => setSelectedCategory(value[0]?.value || "")}
                    badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                      isDisabled: selectedCategory === category.id,
                    }))}
                    placeholder="Select Category"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        No Categories found.
                      </p>
                    }
                    hidePlaceholderWhenSelected
                    triggerSearchOnFocus
                  />
                </div>

                {/* Level 1 - Sub-Category */}
                <div className="space-y-3">
                  <Label htmlFor="subCategory" className="text-sm font-medium">
                    Sub-Category (Level 1)
                  </Label>

                  <MultipleSelector
                    value={selectedSubCategory ? [{ label: subCategories.find(cat => cat.id === selectedSubCategory)?.name || "", value: selectedSubCategory }] : []}
                    onChange={(value) => setSelectedSubCategory(value[0]?.value || "")}
                    badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                    options={subCategories
                      .filter((sub) => sub.parentId === selectedCategory)
                      .map((subCategory) => ({
                        value: subCategory.id,
                        label: subCategory.name,
                        isDisabled: selectedSubCategory === subCategory.id,
                      }))}
                    placeholder="Select Sub-Category"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        No Sub-Categories found.
                      </p>
                    }
                    hidePlaceholderWhenSelected
                    triggerSearchOnFocus
                    disabled={categoryMode === "create" || !selectedCategory}
                  />
                </div>

                {/* Level 2 - Sub-Sub-Category */}
                <div className="space-y-3">
                  <Label htmlFor="subSubCategory" className="text-sm font-medium">
                    Sub-Sub-Category (Level 2)
                  </Label>
                  <MultipleSelector
                    value={selectedSubSubCategory ? [{ label: subSubCategories.find(cat => cat.id === selectedSubSubCategory)?.name || "", value: selectedSubSubCategory }] : []}
                    onChange={(value) => setSelectedSubSubCategory(value[0]?.value || "")}
                    badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                    options={subSubCategories
                      .filter((subSub) => subSub.parentId === selectedSubCategory)
                      .map((subSubCategory) => ({
                        value: subSubCategory.id,
                        label: subSubCategory.name,
                        isDisabled: selectedSubSubCategory === subSubCategory.id,
                      }))}
                    placeholder="Select Sub-Sub-Category"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        No Sub-Sub-Categories found.
                      </p>
                    }
                    hidePlaceholderWhenSelected
                    triggerSearchOnFocus
                    disabled={subCategoryMode === "create" || !selectedSubCategory}
                    creatable
                  />
                </div>

                {/* Level 3 - Sub-Sub-Sub-Category */}
                <div className="space-y-3">
                  <Label htmlFor="subSubSubCategory" className="text-sm font-medium">
                    Sub-Sub-Sub-Category (Level 3)
                  </Label>

                  <MultipleSelector
                    value={selectedSubSubSubCategory ? [{ label: subSubSubCategories.find(cat => cat.id === selectedSubSubSubCategory)?.name || "", value: selectedSubSubSubCategory }] : []}
                    onChange={(value) => setSelectedSubSubSubCategory(value[0]?.value || "")}
                    badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                    options={subSubSubCategories
                      .filter((subSubSub) => subSubSub.parentId === selectedSubSubCategory)
                      .map((subSubSubCategory) => ({
                        value: subSubSubCategory.id,
                        label: subSubSubCategory.name,
                        isDisabled: selectedSubSubSubCategory === subSubSubCategory.id,
                      }))}
                    placeholder="Select Sub-Sub-Sub-Category"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        No Sub-Sub-Sub-Categories found.
                      </p>
                    }
                    hidePlaceholderWhenSelected
                    triggerSearchOnFocus
                    disabled={subSubCategoryMode === "create" || !selectedSubSubCategory}
                    creatable
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <Label className="text-sm mb-2 block">Tags</Label>
              <div className="flex gap-2">
                <MultipleSelector
                  value={selectedTags.map(tag => ({ value: tag, label: tag }))}
                  onChange={(values) => setSelectedTags(values.map(v => v.value))}
                  badgeClassName="bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-white"
                  options={availableTags.map((tag) => ({
                    value: tag,
                    label: tag,
                  }))}
                  // onCreateOption={(newTag) => {
                  //   setSelectedTags((prev) => [...prev, newTag])
                  //   setCustomTags((prev) => [...prev, newTag])
                  // }}
                  placeholder="Select Tags"
                  emptyIndicator={
                    <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                      No Tags found.
                    </p>
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