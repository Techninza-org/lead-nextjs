"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, ChevronRight, ChevronDown, X, Tag, FolderTree, Filter, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Define types for our data structure
type Category = {
  id: string
  name: string
  level: number
  children: Category[]
}

type CategoryData = {
  categories: Category[]
  tags: string[]
}

export default function FilterDropdown({ initialData }: { initialData: CategoryData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [data] = useState<CategoryData>(initialData || { categories: [], tags: [] })
  const [categorySearch, setCategorySearch] = useState("")
  const [tagSearch, setTagSearch] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({})
  const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({})
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<{
    categories: { id: string; name: string }[]
    tags: string[]
  }>({ categories: [], tags: [] })

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize data
  useEffect(() => {
    if (initialData) {
      setFilteredCategories(initialData.categories || [])
      setFilteredTags(initialData.tags || [])
    }
  }, [initialData])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter categories based on search
  useEffect(() => {
    if (!categorySearch.trim()) {
      setFilteredCategories(data.categories || [])
      return
    }

    const searchLower = categorySearch.toLowerCase()

    const searchCategories = (categories: Category[]): Category[] => {
      if (!categories || !Array.isArray(categories)) return []

      return categories
        .map((category) => {
          const matches = category.name.toLowerCase().includes(searchLower)
          const matchingChildren = searchCategories(category.children || [])

          if (matches || matchingChildren.length > 0) {
            return {
              ...category,
              children: matchingChildren,
            }
          }

          return null
        })
        .filter(Boolean) as Category[]
    }

    setFilteredCategories(searchCategories(data.categories || []))
  }, [categorySearch, data.categories])

  // Filter tags based on search
  useEffect(() => {
    if (!tagSearch.trim()) {
      setFilteredTags(data.tags || [])
      return
    }

    const searchLower = tagSearch.toLowerCase()
    setFilteredTags((data.tags || []).filter((tag) => tag.toLowerCase().includes(searchLower)))
  }, [tagSearch, data.tags])

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // Toggle category selection
  const toggleCategorySelection = (category: Category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category.id]: !prev[category.id],
    }))
  }

  // Toggle tag selection
  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tag]: !prev[tag],
    }))
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedCategories({})
    setSelectedTags({})
  }

  // Apply filters
  const applyFilters = () => {
    // Get selected category IDs and names
    const selectedCategoryEntries = Object.entries(selectedCategories)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => ({ id, name: getCategoryNameById(id, data.categories) }))
      .filter((item) => item.name) // Filter out any items without names

    // Get selected tags
    const selectedTagEntries = Object.entries(selectedTags)
      .filter(([_, isSelected]) => isSelected)
      .map(([tag]) => tag)

    setAppliedFilters({
      categories: selectedCategoryEntries,
      tags: selectedTagEntries,
    })

    setIsOpen(false)
  }

  // Helper function to get category name by ID
  const getCategoryNameById = (id: string, categories: Category[] = []): string => {
    if (!categories || !Array.isArray(categories)) return ""

    for (const category of categories) {
      if (category.id === id) return category.name

      const childName = getCategoryNameById(id, category.children)
      if (childName) return childName
    }

    return ""
  }

  // Clear applied filters
  const clearAppliedFilters = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAppliedFilters({ categories: [], tags: [] })
    clearSelections()
  }

  // Remove a specific filter
  const removeFilter = (type: "category" | "tag", value: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (type === "category") {
      // Find the category ID to remove
      const categoryToRemove = appliedFilters.categories.find((cat) => cat.name === value)

      if (categoryToRemove) {
        // Remove from selected categories
        setSelectedCategories((prev) => ({
          ...prev,
          [categoryToRemove.id]: false,
        }))

        // Remove from applied filters
        setAppliedFilters((prev) => ({
          ...prev,
          categories: prev.categories.filter((cat) => cat.name !== value),
        }))
      }
    } else {
      // Remove tag
      setSelectedTags((prev) => ({
        ...prev,
        [value]: false,
      }))

      setAppliedFilters((prev) => ({
        ...prev,
        tags: prev.tags.filter((tag) => tag !== value),
      }))
    }
  }

  // Render a category and its children recursively
  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories[category.id]
    const isSelected =
      selectedCategories[category.id] || appliedFilters.categories.some((cat) => cat.id === category.id)
    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id} className="ml-2">
        <div className="flex items-center py-0.5">
          {hasChildren && (
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 mr-1" onClick={() => toggleExpand(category.id)}>
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          <Checkbox
            id={category.id}
            checked={isSelected}
            onCheckedChange={() => toggleCategorySelection(category)}
            className="mr-1 h-3 w-3"
          />
          <label htmlFor={category.id} className="text-xs cursor-pointer">
            {category.name}
          </label>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-1 border-l pl-1 border-border">
            {category.children.map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    )
  }

  // Initialize selected items based on applied filters
  useEffect(() => {
    // Set selected categories based on applied filters
    appliedFilters.categories.forEach((category) => {
      setSelectedCategories((prev) => ({
        ...prev,
        [category.id]: true,
      }))
    })

    // Set selected tags based on applied filters
    appliedFilters.tags.forEach((tag) => {
      setSelectedTags((prev) => ({
        ...prev,
        [tag]: true,
      }))
    })
  }, [])

  // Get selected items for display
  const getSelectedItems = () => {
    // Get selected category names
    const categoryNames = Object.entries(selectedCategories)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => getCategoryNameById(id, data.categories))
      .filter(Boolean)

    // Get selected tags
    const tags = Object.entries(selectedTags)
      .filter(([_, isSelected]) => isSelected)
      .map(([tag]) => tag)

    return { categoryNames, tags }
  }

  const { categoryNames: selectedCategoryNames, tags: selectedTagNames } = getSelectedItems()
  const totalSelected = selectedCategoryNames.length + selectedTagNames.length
  const totalApplied = appliedFilters.categories.length + appliedFilters.tags.length

  if (!initialData || Object.keys(initialData).length === 0) return null

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-2", totalApplied > 0 ? "bg-primary/10" : "")}
      >
        <Filter className="h-4 w-4" />
        <span>{totalApplied > 0 ? `Filters (${totalApplied})` : "Filters"}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Applied Filters */}
      {totalApplied > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 max-w-md">
          {appliedFilters.categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="flex items-center gap-1 text-xs">
              {category.name}
              <X className="h-3 w-3 cursor-pointer" onClick={(e) => removeFilter("category", category.name, e)} />
            </Badge>
          ))}
          {appliedFilters.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1 text-xs">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={(e) => removeFilter("tag", tag, e)} />
            </Badge>
          ))}
          {totalApplied > 0 && (
            <Badge
              variant="destructive"
              className="flex items-center gap-1 text-xs cursor-pointer"
              onClick={clearAppliedFilters}
            >
              Clear All
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown Filter UI */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-background border rounded-lg shadow-lg">
          <div className="p-3">
            <Tabs defaultValue="categories" className="w-full">
              <div className="flex justify-between items-center mb-2">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="categories" className="text-xs flex items-center gap-1">
                    <FolderTree className="h-3 w-3" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger value="tags" className="text-xs flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </TabsTrigger>
                </TabsList>

                <Button variant="ghost" size="sm" onClick={clearSelections} className="text-xs h-7 px-2">
                  Clear
                </Button>
              </div>

              <TabsContent value="categories" className="mt-0">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-7 h-7 text-xs"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[180px] border rounded-md p-1">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => renderCategory(category))
                  ) : (
                    <p className="text-xs text-muted-foreground p-1">No categories found</p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tags" className="mt-0">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    className="pl-7 h-7 text-xs"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[180px] border rounded-md p-1">
                  <div className="grid grid-cols-2 gap-1">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <div key={tag} className="flex items-center py-0.5">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={selectedTags[tag] || false}
                            onCheckedChange={() => toggleTagSelection(tag)}
                            className="mr-1 h-3 w-3"
                          />
                          <label htmlFor={`tag-${tag}`} className="text-xs cursor-pointer truncate">
                            {tag}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground p-1 col-span-2">No tags found</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Selected Items Display */}
            <div className="mt-3 border-t pt-2">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-medium">Selected ({totalSelected})</h3>
              </div>

              <ScrollArea className="max-h-[80px]">
                <div className="flex flex-wrap gap-1">
                  {selectedCategoryNames.map((name) => (
                    <Badge key={name} variant="secondary" className="flex items-center gap-1 text-xs py-0 px-2">
                      {name}
                      <X
                        className="h-2 w-2 cursor-pointer"
                        onClick={() => {
                          // Find the category ID by name
                          const findCategoryId = (categories: Category[] = [], name: string): string | null => {
                            if (!categories || !Array.isArray(categories)) return null

                            for (const category of categories) {
                              if (category.name === name) return category.id
                              const found = findCategoryId(category.children, name)
                              if (found) return found
                            }
                            return null
                          }

                          const id = findCategoryId(data.categories, name)
                          if (id) {
                            setSelectedCategories((prev) => ({
                              ...prev,
                              [id]: false,
                            }))
                          }
                        }}
                      />
                    </Badge>
                  ))}
                  {selectedTagNames.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1 text-xs py-0 px-2">
                      {tag}
                      <X className="h-2 w-2 cursor-pointer" onClick={() => toggleTagSelection(tag)} />
                    </Badge>
                  ))}
                  {totalSelected === 0 && <span className="text-xs text-muted-foreground">No items selected</span>}
                </div>
              </ScrollArea>
            </div>

            {/* Apply Button */}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="w-1/3 h-8 text-xs" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button className="w-2/3 h-8 text-xs" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

