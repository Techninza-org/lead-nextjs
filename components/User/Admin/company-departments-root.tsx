'use client'
import { useCompany } from '@/components/providers/CompanyProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useModal } from '@/hooks/use-modal-store'
import { userAtom } from '@/lib/atom/userAtom'
import { deptQueries } from '@/lib/graphql/dept/queries'
import { LOGIN_USER } from '@/lib/graphql/user/mutations'
import { DeptMutation } from '@/lib/graphql/dept/mutation'
import { useQuery } from 'graphql-hooks'
import { useAtomValue } from 'jotai'
import { PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react';

const CompanyDepartmentsRoot = () => {
  const [deptId, setDeptId] = useState('');
  const { onOpen } = useModal();
  const userInfo = useAtomValue(userAtom);
  const { departments } = useCompany()

  const { data, loading, error, refetch } = useQuery(deptQueries.GET_COMPANY_DEPTS, {
    variables: {
      companyId: userInfo?.companyId,
    },
    skip: !userInfo?.token || !userInfo?.companyId,
    refetchAfterMutations: [
      LOGIN_USER,
      DeptMutation.UPDATE_DEPT,
    ],
  });

  useEffect(() => {
    if (data?.getCompanyDepts?.[0]?.companyForms?.length > 0) {
      setDeptId(data.getCompanyDepts[0].id);
    }
  }, [data])

  useEffect(() => {
    if (userInfo?.companyId || departments.length === 0) {
      refetch();
    }
  }, [userInfo?.companyId]);

  const handleEditClick = (e: any, form: any) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen('editDeptForm', { form });
  };

  if (loading) return <div>Loading...</div>;

  const groupFormOnCategoryName = data?.getCompanyDepts?.[0]?.companyForms && Object.groupBy(
    data?.getCompanyDepts?.[0].companyForms ?? [],
    (form: any) => form?.category?.name || "Uncategorized"
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="ml-auto">
            <Button size="sm" onClick={() => onOpen('addDept', { refetch })}>Add Form</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupFormOnCategoryName ?? {}).map(([categoryName, forms]) => (
            <Card key={categoryName} className="border-slate-200">
              <CardHeader>
                <CardTitle className="font-bold flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {categoryName}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-8 ">
                {Array.isArray(forms) && forms.map((form: any) => {
                  return (
                    <div className="relative" key={form.id}>
                      <Link
                        className="p-6 border rounded-md text-center block shadow hover:shadow-lg transition-shadow duration-200"
                        href={`/departments/form/${categoryName}/${form.name}/${deptId}/${userInfo?.companyId}`}
                      >
                        <CardTitle className="flex items-center justify-center gap-2">
                          {form.name}
                        </CardTitle>
                      </Link>
                      <div className='absolute -top-2 -right-3 flex gap-2'>
                        {form.dependentOnId && (
                          <Badge variant="secondary" className="capitalize">
                            {form.dependentOnId}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="capitalize cursor-pointer"
                          onClick={(e) => handleEditClick(e, form)}
                        >
                          <PencilIcon size={14} />
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </>
  );
};

export default CompanyDepartmentsRoot;