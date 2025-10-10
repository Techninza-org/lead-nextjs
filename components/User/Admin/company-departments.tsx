'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useModal } from '@/hooks/use-modal-store'
import { userAtom } from '@/lib/atom/userAtom'
import { companyMutation } from '@/lib/graphql/company/mutation'
import { companyQueries } from '@/lib/graphql/company/queries'
import { deptQueries } from '@/lib/graphql/dept/queries'
import { LOGIN_USER } from '@/lib/graphql/user/mutations'
import { userQueries } from '@/lib/graphql/user/queries'
import { useMutation, useQuery } from 'graphql-hooks'
import { useAtomValue } from 'jotai'
import React, { useEffect, useState } from 'react'

const CompanyDepartments = ({ id }: { id: string }) => {
  const [departments, setDepartments] = React.useState([])
  // const [plans, setPlans] = useState([]);
  const [deptId, setDeptId] = React.useState('')
  // const [companySubscription, setCompanySubscription] = useState('')
  // const [updateCompanySubscription] = useMutation(companyMutation.UPDATE_COMPANY_SUBSCRIPTION);
  const { onOpen } = useModal()
  const userInfo = useAtomValue(userAtom)

  const { toast } = useToast()
  const { data, loading, error } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
    variables: {
      companyId: id,
    },
    skip: !userInfo?.token || !id,
    refetchAfterMutations: [
      {
        mutation: LOGIN_USER
      },
    ],
  })

  useEffect(()=>{
    if(data?.getCompanyDepts?.[0]?.companyDeptForms.length > 0){
      setDeptId(data.getCompanyDepts[0].id);
      setDepartments(data?.getCompanyDepts[0]?.companyDeptForms);
    }
  },[data])

  // const { data: plansData, loading: plansLoading } = useQuery(userQueries.GET_PLANS, {
  //   onSuccess: ({ data }) => {
  //     setPlans(data.getPlans)
  //   }
  // });

  // const { data: activePlan, loading: subLoading } = useQuery(companyQueries.GET_COMPANY_SUBSCRIPTION, {
  //   variables: {
  //     companyId: id
  //   },
  //   onSuccess: ({ data }) => {

  //     if (data.getCompanySubscription.Subscriptions.length === 0) return;
  //     const subsLenght = data.getCompanySubscription.Subscriptions.length;
  //     setCompanySubscription(data.getCompanySubscription.Subscriptions[subsLenght - 1].planId)
  //   }
  // });

  // async function handleUpdatePlan(planId: string, planAllowedDeptsIds: string[], duration: number) {
  //   try {
  //     const startDate = new Date().toISOString();
  //     const endDate = new Date();
  //     endDate.setMonth(endDate.getMonth() + duration);
  //     const { data, error } = await updateCompanySubscription({
  //       variables: {
  //         companyId: id,
  //         planId: planId,
  //         allowedDeptsIds: planAllowedDeptsIds,
  //         startDate: startDate,
  //         endDate: endDate.toISOString(),
  //       },
  //     });
  //     if (error) {
  //       const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
  //       toast({
  //         title: 'Error',
  //         description: message || "Something went wrong",
  //         variant: "destructive"
  //       });
  //       return;
  //     }

  //     toast({
  //       variant: "default",
  //       title: "Company Subscription Updated Successfully!",
  //     });
  //   } catch (err) {
  //   }

  // }


  if (loading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold">Departments</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-8'>
        {
          departments?.map((dept: any) => (
            <Card key={dept.id} onClick={() => onOpen("updateDepartmentFields", { deptName: dept.name, deptId: deptId, depId: id })}>
              <CardContent className='grid place-content-center p-6 hover:bg-slate-200 cursor-pointer hover:rounded-md'>
                <CardTitle>{dept.name}</CardTitle>
              </CardContent>
            </Card>
          ))
        }
      </CardContent>
      {/* <CardHeader>
        <CardTitle className="font-bold">Subscription</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-8'>
        {
          plans?.map((plan: any) => (
            <Card key={plan.id} onClick={() => handleUpdatePlan(plan.id, plan.defaultAllowedDeptsIds, plan.duration)} className={`${plan.id === companySubscription ? 'bg-green-500 text-white' : ''}`}>
              <CardContent className='grid place-content-center p-6 hover:bg-slate-200 cursor-pointer hover:rounded-md'>
                <CardTitle>
                  {plan.name}
                </CardTitle>
              </CardContent>
            </Card>
          ))
        }
      </CardContent > */}
    </Card >
  )
}

export default CompanyDepartments