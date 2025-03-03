"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useManualQuery, useMutation, useQuery } from 'graphql-hooks';
import { userQueries } from '@/lib/graphql/user/queries';
import { useAtom, useAtomValue } from 'jotai';
import { companyDeptFieldsAtom, companyDeptMembersAtom, rootMembersAtom, userAtom, userAuthToken } from "@/lib/atom/userAtom";
import { z } from 'zod';
import { createCompanyMemberSchema } from '@/types/auth';
import { leadMutation } from '@/lib/graphql/lead/mutation';
import { LOGIN_USER, UPDATE_USER_COMPANY } from '@/lib/graphql/user/mutations';
import { deptQueries } from '@/lib/graphql/dept/queries';
import { leadQueries } from '@/lib/graphql/lead/queries';
import { companyQueries } from '@/lib/graphql/company/queries';
import { DeptMutation } from '@/lib/graphql/dept/mutation';
import { formatPermissions } from '@/lib/utils';

type CompanyContextType = {
    companyDeptMembers: z.infer<typeof createCompanyMemberSchema>[] | null;
    rootInfo: z.infer<typeof createCompanyMemberSchema>[] | null;
    members: any;
    companyDeptFields: any;
    leadRangeData: any;
    companyForm: any;
    departments: any;
    optForms: any;
    companyMemberRoles: any;
    roles: any;
    permissions: any;
    permissionsResources: any;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
    const userInfo = useAtomValue(userAtom)

    const [leadAssignTo, { loading: assignLoading }] = useMutation(leadMutation.LEAD_ASSIGN_TO)
    const [companyDeptMembers, setCompanyDeptMembers] = useAtom(companyDeptMembersAtom);
    const [companyDeptFields, setCompanyDeptFields] = useAtom(companyDeptFieldsAtom);
    const [rootMembersInfo, setRootMembersAtom] = useAtom(rootMembersAtom)
    const [rootInfo, setRootInto] = useState<z.infer<typeof createCompanyMemberSchema>[] | null>(null)
    const [members, setMembers] = useState<any>([])
    const [leadRangeData, setLeadRangeData] = React.useState<any>([])
    const [departments, setDepartmentsForms] = useState([])
    const [optForms, setOptForms] = useState([])
    const [companyForm, setCompanyForms] = useState([])
    const [companyMemberRoles, setCompanyMemberRoles] = useState<any>([])
    const [roles, setRoles] = useState<any[]>([])
    const [permissions, setPermissions] = useState<any[]>([])
    const [permissionsResources, setPermissionsResources] = useState<any[]>([])

    const authToken = useAtomValue(userAuthToken)

    const { skip, variables } = {
        skip: ['ROOT', 'MANAGER'].includes(userInfo?.role?.name || "") && !!userInfo?.companyId && !!authToken,
        variables: {
            deptId: userInfo?.deptId,
            companyId: userInfo?.companyId,
        },
    };

    const { data: memberData } = useQuery(userQueries.GET_MEMBERS, {
        skip,
        variables: {
            role: "Sales Person"
        },
        refetchAfterMutations: LOGIN_USER,
        onSuccess: ({ data }) => {
            setMembers(data)
        }
    })

    const { data, error: queryError, loading: queryLoading } = useQuery(userQueries.GET_COMPANY_DEPT_MEMBERS, {
        skip: skip && !!userInfo?.deptId,
        variables,
        refetchAfterMutations: [leadAssignTo, UPDATE_USER_COMPANY],
        onSuccess: ({ data }) => {
            if (data?.getCompanyDeptMembers) setCompanyDeptMembers(data.getCompanyDeptMembers)
        }
    });

    const { data: deptFields, loading: deptFieldsLoading, error: deptFieldsError } = useQuery(deptQueries.GET_COMPANY_DEPT_FIELDS, {
        skip,
        variables: { deptId: userInfo?.deptId },
        onSuccess: ({ data }) => {
            if (data?.getCompanyDeptFields) {
                setCompanyDeptFields(data?.getCompanyDeptFields)
                setOptForms(data?.getCompanyDeptFields.filter((field: any) => ['LEAD', "PROSPECT", "LEAD FOLLOW UP", "PROSPECT FOLLOW UP"].includes(String(field.name).toUpperCase())))
            }
        },
    });

    const { } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
        variables: {
            companyId: userInfo?.companyId,
        },
        skip,
        refetchAfterMutations: [
            {
                mutation: LOGIN_USER,
            },
        ],
        onSuccess: ({ data }) => {
            if (data?.getCompanyDepts?.[0]?.companyForms?.length > 0) {
                setCompanyForms(data?.getCompanyDepts?.[0].companyForms);
            }
        }
    });


    const { data: rootDate, loading, error } = useQuery(userQueries.GET_COMPANIES, {
        skip,
        onSuccess: ({ data }) => {
            if (data?.getRootUsers) setRootInto(data.getRootUsers)
            if (data?.getRootUsers) setRootMembersAtom(data.getRootUsers)
        }
    });

    const { data: leadRange, loading: leadRangeLoader, error: leadRangeError, refetch } = useQuery(leadQueries.GET_LEADS_BY_DATE_RANGE, {
        skip,
        variables: {
            companyId: userInfo?.companyId,
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString('en-GB'),
            endDate: new Date().toLocaleDateString('en-GB')
        },
        onSuccess: ({ data }) => {
            setLeadRangeData(data?.getLeadsByDateRange)
        },
    })

    const { } = useQuery(companyQueries.GET_ALL_ROLES, {
        skip,
        onSuccess: ({ data }) => {
            setCompanyMemberRoles(data.getAllRoles)
        }
    });

    const { } = useQuery(userQueries.GET_ROLES, {
        skip,
        variables: {
            companyId: userInfo?.companyId,
        },
        onSuccess: ({ data }) => {
            setRoles(data.getRoles)
            //   if (data.getRoles.length > 0) {
            //     setSelectedRole(data.getRoles[0].id)
            //   }
        }
    })
    const { } = useQuery(userQueries.GET_PERMISSIONS, {
        skip,
        onSuccess: ({ data }) => {
            setPermissions(formatPermissions(data.getPermissions))
        }
    })

    const { } = useQuery(userQueries.COMPANY_RESOURCES, {
        skip,
        onSuccess: ({ data }) => {
            if (data.permissioResources)
                setPermissionsResources(data.permissioResources)
        },
    })

    // const { error: dpetError } = useQuery(userQueries.GET_DEPT_OPT_FIELDS, {
    //     skip,
    //     variables: { deptId: userInfo?.deptId },
    //     onSuccess: ({ data }) => {
    //         setOptForms(data?.getCompanyDeptOptFields)
    //     },
    // })

    return (
        <CompanyContext.Provider value={{
            roles, permissions, permissionsResources, companyMemberRoles, companyForm, departments, leadRangeData, companyDeptMembers, rootInfo, members, companyDeptFields, optForms
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
