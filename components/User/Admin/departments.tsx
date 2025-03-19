'use client'
import { useAdmin } from '@/components/providers/AdminProvider'
import { useCompany } from '@/components/providers/CompanyProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useModal } from '@/hooks/use-modal-store'
import Link from 'next/link'
import React from 'react'

const Departments = () => {
  // const { departments, braodcasteForm, optForms } = useCompany()
  const { departmentsForms } = useAdmin()

  const { onOpen } = useModal()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-bold flex items-center justify-between">
            <div>Departments Forms</div>
            <Button size="sm">Add Department</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-8">
          {departmentsForms?.map((dept) => (
            <Link
              className="p-6 border rounded-md text-center shadow hover:shadow-lg transition-shadow duration-200"
              href={`/admin/depts/${dept.name.toLowerCase()}`}
              key={dept.id}
            >
              <CardTitle className="flex items-center justify-center gap-2">
                {dept.name}
                {dept.isNew && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    NEW
                  </Badge>
                )}
              </CardTitle>
            </Link>
          ))}
        </CardContent>
      </Card>
      {/* <Card className='my-3'>
        <CardHeader>
          <CardTitle className="font-bold">Broadcast</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-8'>
          <Card onClick={() => onOpen("updateGlobalBroadcastForm", { dept: braodcasteForm })}>
            <CardContent className='grid place-content-center p-6 hover:bg-slate-200 cursor-pointer hover:rounded-md'>
              <CardTitle>{"Broadcast"}</CardTitle>
            </CardContent>
          </Card>
        </CardContent>
      </Card> */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="font-bold">Departments Operational Forms</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-8">
          {optForms?.map((dept: any) => (
            <Link className='p-6 border rounded-md text-center shadow' href={`/admin/depts/${dept.name}`} key={dept.id}>
              <CardTitle>{dept.name}ss</CardTitle>
            </Link>
          ))}
        </CardContent>
      </Card> */}
    </>
  )
}

export default Departments