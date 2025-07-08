import EditCompanyFunction from '@/components/User/Admin/company/edit-company-function'
import React from 'react'

export default function page({ params }: { params: { id: string } }) {
    
  return (
    <EditCompanyFunction id={params.id} />
  )
}
