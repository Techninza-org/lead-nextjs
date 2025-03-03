"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateRoleTableView } from "@/components/role/create-role-form"
import { PermissionConfig } from "@/components/role/permission-config"

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState("create")

  return (
    <div className="container mx-auto py-10 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="create">Create Role</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <CreateRoleTableView />
            </TabsContent>
            <TabsContent value="permissions">
              <PermissionConfig />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

