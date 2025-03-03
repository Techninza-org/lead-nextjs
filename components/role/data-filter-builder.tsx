"use client"

import { Plus, X, ArrowUp, ArrowDown, Filter, Calendar as CalendarIcon, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ComboboxSelect } from "./ComboboxSelect"

interface Field {
  name: string
  type: string
}

interface FilterCondition {
  field: string
  operator: string
  value: string
  logicalOperator?: "AND" | "OR"
}

interface FilterGroup {
  conditions: FilterCondition[]
  logicalOperator: "AND" | "OR"
}

interface FilterBuilderProps {
  fields: Field[]
  onFilterChange: (filters: FilterGroup[]) => void
  filters?: FilterGroup[]
}

export default function FilterBuilder({ fields, onFilterChange, filters: initialFilters }: FilterBuilderProps) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    initialFilters?.length ? initialFilters : [
      { conditions: [{ field: "", operator: "equals", value: "" }], logicalOperator: "AND" },
    ]
  )
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialFilters?.length) {
      setFilterGroups(initialFilters)
    } else {
      setFilterGroups([
        { conditions: [{ field: "", operator: "equals", value: "" }], logicalOperator: "AND" },
      ])
    }
  }, [initialFilters])

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
    { value: "greaterThan", label: "Greater than" },
    { value: "lessThan", label: "Less than" },
  ]

  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // Prevent the select from auto-focusing the first item
    e.stopPropagation()
  }

  const updateFilterCondition = (
    groupIndex: number,
    conditionIndex: number,
    type: "field" | "operator" | "value" | "logicalOperator",
    newValue: string,
  ) => {
    const newGroups = [...filterGroups]

    if (type === "logicalOperator") {
      newGroups[groupIndex].logicalOperator = newValue as "AND" | "OR"
    } else {
      newGroups[groupIndex].conditions[conditionIndex] = {
        ...newGroups[groupIndex].conditions[conditionIndex],
        [type]: newValue,
      }
    }

    setFilterGroups(newGroups)
    onFilterChange(newGroups)
  }

  const addCondition = (groupIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions.push({ field: "", operator: "equals", value: "" })
    setFilterGroups(newGroups)
    onFilterChange(newGroups)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions.splice(conditionIndex, 1)
    if (newGroups[groupIndex].conditions.length === 0) {
      newGroups.splice(groupIndex, 1)
    }
    setFilterGroups(newGroups)
    onFilterChange(newGroups)
  }

  const addFilterGroup = () => {
    setFilterGroups([
      ...filterGroups,
      {
        conditions: [{ field: "", operator: "equals", value: "" }],
        logicalOperator: "AND",
      },
    ])
  }

  const moveCondition = (groupIndex: number, conditionIndex: number, direction: "up" | "down") => {
    const newGroups = [...filterGroups]
    const conditions = newGroups[groupIndex].conditions
    const newIndex = direction === "up" ? conditionIndex - 1 : conditionIndex + 1

    if (newIndex >= 0 && newIndex < conditions.length) {
      ;[conditions[conditionIndex], conditions[newIndex]] = [conditions[newIndex], conditions[conditionIndex]]
      setFilterGroups(newGroups)
      onFilterChange(newGroups)
    }
  }

  const renderValueInput = (condition: FilterCondition, groupIndex: number, conditionIndex: number) => {
    const field = fields.find(f => f.name === condition.field)

    if (field?.type === 'date' || field?.name === "createdAt") {
      return (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !condition.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {condition.value ? format(new Date(condition.value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={condition.value ? new Date(condition.value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const datetime = new Date(date)
                    datetime.setHours(new Date().getHours())
                    datetime.setMinutes(new Date().getMinutes())
                    updateFilterCondition(groupIndex, conditionIndex, "value", datetime.toISOString())
                  }
                }}
                initialFocus
              />
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Input
                    type="time"
                    className="w-full"
                    value={condition.value ? format(new Date(condition.value), "HH:mm") : ""}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':')
                      const datetime = condition.value ? new Date(condition.value) : new Date()
                      datetime.setHours(parseInt(hours))
                      datetime.setMinutes(parseInt(minutes))
                      updateFilterCondition(groupIndex, conditionIndex, "value", datetime.toISOString())
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )
    }

    return (
      <Input
        className="w-[180px]"
        placeholder="Value"
        value={condition.value}
        onChange={(e) => updateFilterCondition(groupIndex, conditionIndex, "value", e.target.value)}
      />
    )
  }

  console.log(JSON.stringify(filterGroups[0]), "group.conditions")

  return (
    <div className="relative">
      <div className="space-y-6 p-6">
        {filterGroups.map((group, groupIndex) => (
          <div
            key={`group-${groupIndex}-${group.conditions?.length}`}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:shadow-sm"
          >
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter Group {groupIndex + 1}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {group.conditions?.map((condition, conditionIndex) => (
                <div key={conditionIndex} className="flex flex-wrap items-center gap-3">
                  {conditionIndex > 0 && (
                    <Select
                      value={group.logicalOperator}
                      onValueChange={(value) => updateFilterCondition(groupIndex, conditionIndex, "logicalOperator", value)}
                    >
                      <SelectTrigger className="w-[90px] bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <ComboboxSelect
                    value={condition.field}
                    onValueChange={(value) => updateFilterCondition(groupIndex, conditionIndex, "field", value)}
                    fields={fields}
                    placeholder="Select field"
                  />
                  {/* <Select
                    value={condition.field}
                    onValueChange={(value) => updateFilterCondition(groupIndex, conditionIndex, "field", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search fields..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onClick={(e) => e.stopPropagation()}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        {filteredFields.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select> */}

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateFilterCondition(groupIndex, conditionIndex, "operator", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {renderValueInput(condition, groupIndex, conditionIndex)}

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveCondition(groupIndex, conditionIndex, "up")}
                      disabled={conditionIndex === 0}
                      className="hover:bg-gray-100"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveCondition(groupIndex, conditionIndex, "down")}
                      disabled={conditionIndex === group.conditions.length - 1}
                      className="hover:bg-gray-100"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(groupIndex, conditionIndex)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => addCondition(groupIndex)}
                className="mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addFilterGroup}
          className="w-full justify-center py-6 border-dashed hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter Group
        </Button>
      </div>
    </div>
  )
}