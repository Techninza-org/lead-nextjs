"use client"
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: 'READ' | 'WRITE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'MANAGE';
}

export interface UserPermissions {
    roleId: string;
    roleName: string;
    permissions: Permission[];
}

import { userAtom } from '@/lib/atom/userAtom';
import { useQuery } from 'graphql-hooks';
import { useAtomValue } from 'jotai';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface PermissionContextType {
    permissions: Permission[];
    loading: boolean;
    allowedPermission: any
    companyRoles: any
    checkPermission: (permission: string) => boolean;
    checkPermissions: (permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const GET_USER_PERMISSIONS = `
    query GetRolePermissions {
        getRolePermissions 
    }
  `;

const GET_COMPANY_PERMISSIONS = `
    query GetCompanyPermissions {
        getCompanyPermissions 
    }
  `;

export const UPDATE_ROLE_PERMISSIONS = `
    mutation UpdateRolePermissions($roleId: String!, $permissions: JSON) {
        updateRolePermissions(roleId: $roleId, permissions: $permissions)
    }
  `;

export function PermissionProvider({ children }: { children: React.ReactNode }) {

    const userInfo = useAtomValue(userAtom);

    const shouldSkipQuery = () => {
        const isValidRole = ['ROOT', 'MANAGER'].includes(userInfo?.role?.name || "");
        const hasCompanyId = !!userInfo?.companyId;
        return isValidRole && !hasCompanyId;
    };

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [companyPermissions, setCompanyPermissions] = useState<Permission[]>([]);
    const [companyRoles, setCompanyRoles] = useState<Permission[]>([]);
    const { loading, error, data } = useQuery(GET_USER_PERMISSIONS, {
        skip: shouldSkipQuery(),
    });

    const { data: companyPermission } = useQuery(GET_COMPANY_PERMISSIONS, {
        skip: shouldSkipQuery(),
    });

    useEffect(() => {
        if (data?.getRolePermissions) {
            
            setPermissions(data.getRolePermissions.map((x: any) => ({ name: `${x.permission.actions.toUpperCase()}:${x.permission.resource.toUpperCase()}` })));
            setCompanyPermissions(data.getRolePermissions.map((x: any) => ({ name: `${x.permission.actions}:${x.permission.resource}` })));
        }
        // if (companyPermission?.getCompanyPermissions) {
        //     setCompanyPermissions(companyPermission.getCompanyPermissions.permissions);
        //     setCompanyRoles(companyPermission.getCompanyPermissions.roles);
        // }
    }, [data, companyPermission]);

    const checkPermission = (permission: string): boolean => {
        return permissions.some(p => p.name === permission);
    };

    const checkPermissions = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.every(permission => checkPermission(permission));
    };

    const value = {
        permissions,
        loading,
        checkPermission,
        checkPermissions,
        allowedPermission: companyPermissions,
        companyRoles,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
};