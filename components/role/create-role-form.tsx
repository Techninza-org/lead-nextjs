"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useCompany } from "../providers/CompanyProvider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "../ui/button"
import { useModal } from "@/hooks/use-modal-store"

export function CreateRoleTableView() {
  const { roles: apiRole } = useCompany()
  const [filteredRoles, setFilteredRoles] = useState<any[]>([])
  const [filters, setFilters] = useState({
    name: "",
    type: "all",
    department: "all"
  })

  const uniqueTypes: string[] = Array.from(new Set(apiRole.map((role: any) => role.type))).filter(Boolean) as string[]
  const uniqueDepartments: string[] = Array.from(new Set(apiRole.map((role: any) => role.department))).filter(Boolean) as string[]

  useEffect(() => {
    const filtered = apiRole.filter((role: any) => {
      const nameMatch = role.name.toLowerCase().includes(filters.name.toLowerCase())
      const typeMatch = filters.type === "all" || role.type === filters.type
      const departmentMatch = filters.department === "all" || role.department === filters.department

      return nameMatch && typeMatch && departmentMatch
    })
    setFilteredRoles(filtered)
  }, [filters, apiRole])

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      name: "",
      type: "all",
      department: "all"
    })
  }

  const { onOpen } = useModal()
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center ">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Filter by name..."
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.department}
            onValueChange={(value) => handleFilterChange("department", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={resetFilters}
            variant={'secondary'}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Reset Filters
          </Button>
        </div>
        <div>
          <Button
            size={'sm'}
            onClick={() => onOpen('create:role')}
          >
            Create Role
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRoles.map((role: any) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell>{role.type}</TableCell>
              <TableCell>{role.department || "-"}</TableCell>
              <TableCell className="text-right">{role.isActive.toString()}</TableCell>
            </TableRow>
          ))}
          {filteredRoles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                No matching roles found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}