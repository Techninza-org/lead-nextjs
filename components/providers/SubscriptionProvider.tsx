"use client";

import { createContext, useContext, useState } from "react";
import { userQueries } from "@/lib/graphql/user/queries";
import { useQuery } from "graphql-hooks";
import { LOGIN_USER } from "@/lib/graphql/user/mutations";
import { useAtomValue } from "jotai";
import { userAtom } from "@/lib/atom/userAtom";

type SubscriptionContextType = {
    plans: any[];
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {

    const userInfo = useAtomValue(userAtom)

    const [plans, setPlans] = useState<any[]>([])

    // const { data: plansData, loading: plansLoading } = useQuery(userQueries.GET_PLANS, {
    //     skip: !userInfo?.token || plans.length > 0,
    //     skipCache: true,
    //     refetchAfterMutations: [
    //         {
    //             mutation: LOGIN_USER
    //         },
    //     ],
    //     onSuccess: ({ data }) => {
    //         setPlans(data.getPlans)
    //     }
    // });


    return (
        <SubscriptionContext.Provider value={{ plans }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
