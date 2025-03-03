import { usePermissions } from "./providers/PermissionContext";
import { ReactNode } from 'react';

interface PermissionGateProps {
  permissions: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ 
  permissions, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { checkPermission, checkPermissions, loading } = usePermissions();
  
  if (loading) {
    return <div>Loading...</div>;
  }

  const hasPermission = Array.isArray(permissions)
    ? checkPermissions(permissions)
    : checkPermission(permissions);

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}