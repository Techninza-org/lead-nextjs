"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/components/providers/PermissionContext"

export default function ValuesIndexPage() {
  const router = useRouter()
  const { allowedPermission } = usePermissions()

  useEffect(() => {
    // Get all VIEW permissions (excluding Lead and Prospects)
    const employeeRoutes = allowedPermission.filter(
      (perm: any) => 
        perm.name.includes("VIEW") && 
        !perm.name.includes("Lead") && 
        !perm.name.includes("Prospects")
    )

    if (employeeRoutes.length > 0) {
      // Get the first available form
      const firstRoute = employeeRoutes[0]
      const routeNameParts = firstRoute.name.split(":")
      const routePart = routeNameParts.length > 1 ? routeNameParts[1] : firstRoute.name
      
      // Get role from pathname
      const pathname = window.location.pathname
      const roleMatch = pathname.match(/\/([^/]+)\/values/)
      const role = roleMatch ? roleMatch[1] : ""
      
      // Redirect to the first available form
      router.replace(`/${role}/values/${routePart}`)
    } else {
      // No forms available, redirect to unauthorized or show message
      router.replace("/unauthorized")
    }
  }, [allowedPermission, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  )
}

