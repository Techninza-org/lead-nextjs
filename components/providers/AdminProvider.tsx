"use client";
import { userAtom } from '@/lib/atom/userAtom';
import { adminQueries } from '@/lib/graphql/admin/queries';
import { useQuery } from 'graphql-hooks';
import { useAtomValue } from 'jotai';
import React, { createContext, useContext, useEffect, useState } from 'react';


type AdminContextType = {
    departmentsForms: any[]
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const userInfo = useAtomValue(userAtom)


    const { skip, variables } = {
        skip: userInfo?.role?.name !== "ADMIN",
        variables: {
            deptId: userInfo?.deptId,
            companyId: userInfo?.companyId,
        },
    };



    const [departmentsForms, setDepartmentsForms] = useState<any[]>([])

    const { } = useQuery(adminQueries.GET_DEPT_FIELDS, {
        skip,
        onSuccess: ({ data }) => {
            // why it is using ???
            setDepartmentsForms(data?.getDeptWFields[0]?.adminDeptForm)
        },
    })

    return (
        <AdminContext.Provider value={{departmentsForms }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within a AdminProvider');
    }
    return context;
};
