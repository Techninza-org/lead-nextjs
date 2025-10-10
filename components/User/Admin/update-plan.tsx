import { Combobox } from "@/components/combo-box";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { useToast } from "@/components/ui/use-toast";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { useMutation } from "graphql-hooks";
import { useState } from "react";


export const CompanyPlan = ({ row }: { row: any }) => {

    const companyId = row.id
    const { plans } = useSubscription()
    const { toast } = useToast()
    const [updateCompanySubscription] = useMutation(companyMutation.UPDATE_COMPANY_SUBSCRIPTION);
    const [selectedPlan, setSelectedPlan] = useState("")


    const totalPlans = row.Company.Subscriptions.length
    const isPlanHas = totalPlans > 0;
    const sub = isPlanHas && row.Company.Subscriptions[totalPlans - 1]

    const options = plans.map((plan) => ({
        value: plan.id,
        label: plan.name
    }))

    async function handleUpdatePlan(planId: string, planAllowedDeptsIds: string[], duration: number) {
        try {
            const startDate = new Date().toISOString();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + duration);
            const { data, error } = await updateCompanySubscription({
                variables: {
                    companyId,
                    planId: planId,
                    allowedDeptsIds: planAllowedDeptsIds,
                    startDate: startDate,
                    endDate: endDate.toISOString(),
                },
            });
            if (error) {
                const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
                toast({
                    title: 'Error',
                    description: message || "Something went wrong",
                    variant: "destructive"
                });
                return;
            }

            toast({
                variant: "default",
                title: "Company Subscription Updated Successfully!",
            });
        } catch (err) {
        }

    }

    return (
        <Combobox
            options={options}
            placeholder={isPlanHas ? sub.plan.name : "No plan exist"}
            value={selectedPlan}
            onChange={(value) => {
                setSelectedPlan(value)
                if (value) {
                    const plan = plans.find((plan) => plan.id === value)
                    handleUpdatePlan(plan.id, plan.defaultAllowedDeptsIds, plan.duration)
                }
            }}
        />
    )
}