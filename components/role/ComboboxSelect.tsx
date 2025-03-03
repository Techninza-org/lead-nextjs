"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxSelectProps {
  value: string
  onValueChange: (value: string) => void
  fields: { name: string }[]
  placeholder?: string
}

export function ComboboxSelect({ value, onValueChange, fields, placeholder = "Select field" }: ComboboxSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredFields = fields.filter((field) => field.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[180px] font-normal capitalize justify-between">
          {value ? fields.find((field) => field.name === value)?.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <div className="flex items-center border-b">
            <CommandInput
              placeholder="Search fields..."
              className="h-9"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
          </div>
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup>
              {filteredFields.map((field) => (
                <CommandItem
                  key={field.name}
                  value={field.name}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === field.name ? "opacity-100" : "opacity-0")} />
                  {field.name.split("_")[0]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

