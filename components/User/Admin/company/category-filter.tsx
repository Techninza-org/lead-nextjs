"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Update the type to match the actual data structure keys
interface CategoryFilterProps {
  type: "categories" | "subCategories" | "subCategories2" | "subCategories3" | "subCategories4"
  items: string[]
}

export function CategoryFilter({ type, items = [] }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : []

  // Safely parse selected values from URL
  const selectedValues = React.useMemo(() => {
    const param = searchParams.get(type)
    return param ? param.split(",").filter(Boolean) : []
  }, [searchParams, type])

  const toggleItem = React.useCallback(
    (item: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = params.get(type)?.split(",").filter(Boolean) || []

      const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]

      if (updated.length > 0) {
        params.set(type, updated.join(","))
      } else {
        params.delete(type)
      }

      router.push(`?${params.toString()}`)
    },
    [router, searchParams, type],
  )

  // Update display names to match the actual data structure
  const displayName = React.useMemo(() => {
    return type === "categories"
      ? "Category"
      : type === "subCategories"
        ? "Sub Category"
        : type === "subCategories2"
          ? "Sub Category 2"
          : type === "subCategories3"
            ? "Sub Category 3"
            : "Sub Category 4"
  }, [type])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          {displayName}
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  selectedValues.map((item) => (
                    <Badge variant="secondary" key={item} className="rounded-sm px-1 font-normal">
                      {item}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${displayName.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {safeItems.map((item) => {
                const isSelected = selectedValues.includes(item)
                return (
                  <CommandItem key={item} onSelect={() => toggleItem(item)}>
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {item}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

