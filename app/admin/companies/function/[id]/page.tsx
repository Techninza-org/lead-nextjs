import CreateCompanyFunction from '@/components/User/Admin/company/create-company-function'
import React from 'react'

export default function page({ params }: { params: { id: string } }) {
    
  return (
    <CreateCompanyFunction id={params.id} />
  )
}
