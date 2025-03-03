"use client"

import { createContext, useContext, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APIError, useManualQuery, useMutation, useQuery } from 'graphql-hooks';
import { useAtomValue, useSetAtom } from 'jotai';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { leadSchema } from '@/types/lead';
import { leads, prospects } from '@/lib/atom/leadAtom';
import { leadQueries } from '@/lib/graphql/lead/queries';
import { userAtom } from '@/lib/atom/userAtom';
import { leadMutation } from '@/lib/graphql/lead/mutation';
import { LOGIN_USER } from '@/lib/graphql/user/mutations';
import { companyQueries } from '@/lib/graphql/company/queries';

interface LeadProviderType {
    handleCreateLead: ({ lead, error }: { lead: z.infer<typeof leadSchema>, error?: APIError<object> | undefined }) => void;
    handleCreateBulkLead: ({ lead, error }: { lead: z.infer<typeof leadSchema>, error?: APIError<object> | undefined }) => void;
    getLeadPagination: (page: number, limit: number, newFilters?: any) => Promise<void>
    getTableFilterOptions: (colId: string, searchValue: string) => Promise<string[] | undefined>
}

const LeadContext = createContext<LeadProviderType | undefined>(undefined);

export const LeadProvider = ({ children }: { children: ReactNode }) => {
    const userInfo = useAtomValue(userAtom);
    const { toast } = useToast();
    const setLeads = useSetAtom(leads);
    const setProspect = useSetAtom(prospects);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Only skip if user has ROOT/MANAGER role but no companyId
    const shouldSkipQuery = () => {
        const isValidRole = ['ROOT', 'MANAGER'].includes(userInfo?.role?.name || "");
        const hasCompanyId = !!userInfo?.companyId;
        return isValidRole && !hasCompanyId;
    };

    const { loading: leadsLoading } = useQuery(
        leadQueries.GET_COMPANY_LEADS,
        {
            variables: { companyId: userInfo?.companyId },
            skip: shouldSkipQuery(),
            onSuccess: ({ data }) => {
                if (data?.getCompanyLeads?.lead) {
                    setLeads(data.getCompanyLeads.lead);
                }
            },
            onError: (error: any) => {
                console.error('Leads query error:', error);
            },
            refetchAfterMutations: [
                { mutation: LOGIN_USER },
                { mutation: leadMutation.LEAD_ASSIGN_TO },
                { mutation: leadMutation.CREATE_LEAD },
                { mutation: leadMutation.APPROVED_LEAD_MUTATION },
            ],
        }
    );

    const { loading: prospectsLoading } = useQuery(
        leadQueries.GET_PROSPECT_LEADS,
        {
            skip: shouldSkipQuery(),
            onSuccess: ({ data }) => {
                if (data?.getCompanyProspects) {
                    setProspect(data.getCompanyProspects);
                }
            },
            onError: (error: any) => {
                console.error('Prospects query error:', error);
            },
            refetchAfterMutations: [
                { mutation: LOGIN_USER },
                { mutation: leadMutation.LEAD_ASSIGN_TO },
                { mutation: leadMutation.CREATE_LEAD },
            ],
        }
    );

    const [fetchPaginationLead] = useManualQuery(leadQueries.GET_COMPANY_LEADS);
    const [fetchfilterOptions] = useManualQuery(companyQueries.GET_TABLE_FILTER_OPTIONS);


    const handleCreateLead = async ({ lead, error }: {
        lead: z.infer<typeof leadSchema>,
        error?: APIError<object> | undefined
    }) => {
        if (error) {
            const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
            toast({
                title: 'Error',
                description: message || "Something went wrong",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: 'Success',
            description: 'Lead created successfully',
            variant: "default",
        });
    };

    const handleCreateBulkLead = async ({ lead, error }: {
        lead: any,
        error?: APIError<object> | undefined
    }) => {
        if (error) {
            const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
            toast({
                title: 'Error',
                description: message || "Something went wrong",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: 'Success',
            description: 'Leads created successfully',
            variant: "default",
        });
    };

    const getLeadPagination = async (page: number, limit: number, newFilters?: any,) => {
        try {
            // Initialize filters with pagination parameters
            const filters: Record<string, any> = {};


            searchParams.forEach((value, key) => {
                if (key !== "page" && key !== "limit") {
                    try {
                        // ✅ Decode and parse JSON for objects like `createdAt`
                        filters[key] = JSON.parse(decodeURIComponent(value));
                    } catch {
                        filters[key] = value; // ✅ Fallback to raw string if not JSON
                    }
                }
            });

            // 🚀 Fetch leads with dynamically built filters
            const { data, error } = await fetchPaginationLead({ variables: { companyId: userInfo?.companyId, filters, page: page.toString(), limit: limit.toString() } });

            // if (error) {
            //     throw new Error(error.graphQLErrors?.map((e: any) => e.message).join(", "));
            // }

            if (data?.getCompanyLeads?.lead) {
                setLeads(data.getCompanyLeads.lead);
            }

            const params = new URLSearchParams(searchParams);
            params.set("page", String(page));
            router.push(`/leads?${params.toString()}`);
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const getTableFilterOptions = async (colId: string, searchValue: string) => {
        try {

            const { data, error } = await fetchfilterOptions({ variables: { searchValue, colId } });
            console.log(data, "data")
            await new Promise((resolve) => setTimeout(resolve, 500))

            if (!data) return []

            const options = data.getTableFilterOptions?.[colId]
            return options.filter((option: string) => option?.toLowerCase()?.includes(searchValue?.toLowerCase()))


        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    return (
        <LeadContext.Provider value={{ getTableFilterOptions, getLeadPagination, handleCreateLead, handleCreateBulkLead }}>
            {children}
        </LeadContext.Provider>
    );
};

export const useLead = (): LeadProviderType => {
    const context = useContext(LeadContext);
    if (!context) {
        throw new Error('useLead must be used within a LeadProvider');
    }
    return context;
};