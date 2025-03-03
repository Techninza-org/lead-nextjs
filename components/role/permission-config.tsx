"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useModal } from "@/hooks/use-modal-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useCompany } from "../providers/CompanyProvider"
import { UPDATE_ROLE_PERMISSIONS } from "../providers/PermissionContext"
import { useMutation } from "graphql-hooks"
import { Input } from "../ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function PermissionConfig() {
  const [roles, setRoles] = useState<any[]>([])
  const { roles: apiRole, permissions: resources, permissionsResources } = useCompany()
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [openResource, setOpenResource] = useState<string | null>(null)
  const [UpdateRolePermissions] = useMutation(UPDATE_ROLE_PERMISSIONS)
  const [filterValue, setFilterValue] = useState("")
  const [filteredResources, setFilteredResources] = useState<any[]>([])

  const { onOpen } = useModal()

  useEffect(() => {
    const fetchData = async () => {
      if (!apiRole) return
      setRoles(apiRole)
    }
    fetchData()
  }, [apiRole])

  useEffect(() => {
    const filtered = resources.filter((resource: any) =>
      resource.name.toLowerCase().includes(filterValue.toLowerCase())
    )
    setFilteredResources(filtered)
  }, [filterValue, resources])

  const togglePermission = async (resourceName: string, action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") => {
    if (!selectedRole) return

    const currentRole = roles.find((role) => role.id === selectedRole)
    if (!currentRole) return

    const updatedRole = { ...currentRole }
    const resourcePermission = resources.find((r: any) => r.name === resourceName)?.permissions[action]

    if (!resourcePermission) return

    const existingPermissionIndex = updatedRole.permissions?.findIndex((p: any) => p.id === resourcePermission.id)

    if (existingPermissionIndex !== -1) {
      updatedRole.permissions.splice(existingPermissionIndex, 1)
    } else {
      updatedRole.permissions.push(resourcePermission)
    }

    setRoles(roles.map((role) => (role.id === selectedRole ? updatedRole : role)))

    try {
      const response = await UpdateRolePermissions({
        variables: {
          roleId: selectedRole,
          permissions: updatedRole.permissions.map((p: any) => ({
            id: p.id,
            actions: [p.actions]
          }))
        },
      });
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      })
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4 gap-2">
        <Input
          placeholder="Search Resource..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 bg-white">Resource</TableHead>
              <TableHead className="sticky top-0 bg-white">View</TableHead>
              <TableHead className="sticky top-0 bg-white">Create</TableHead>
              <TableHead className="sticky top-0 bg-white">Update</TableHead>
              <TableHead className="sticky top-0 bg-white">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(filteredResources.length > 0 ? filteredResources : resources).map((resource: any) => {
              const rolePermissions = roles.find((r) => r.id === selectedRole)?.permissions || []

              const currResource = permissionsResources.models.find((r: any) => r.name === resource.name)
              const currResourceRelation = permissionsResources.relationships.filter((r: any) => r.name === resource.name && r.name === r.fromModel)
              return (
                <TableRow key={resource.name}>
                  <TableCell
                    className="text-blue-900 cursor-pointer"
                    onClick={() => selectedRole && onOpen("role:permission_config", {
                      role: rolePermissions,
                      table: currResource,
                      relationships: currResourceRelation
                    })}
                  >
                    {resource.name}
                  </TableCell>
                  {
                    (["VIEW", "CREATE", "UPDATE", "DELETE"] as const).map((action) => (
                      <TableCell key={action}>
                        <Checkbox
                          checked={rolePermissions.some(
                            (p: any) => p.actions === action && resource.permissions[action]?.id === p.id,
                          )}
                          onCheckedChange={() => togglePermission(resource.name, action)}
                        />
                      </TableCell>
                    ))
                  }
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div >
  )
}