
"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/DataTable"
import { CompanyFunctionCols } from "@/components/User/Admin/companies-list-col"
import { RootTable } from "@/components/User/Admin/root-table"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { useQuery } from "graphql-hooks"
import { Building2 } from "lucide-react"
import { useState } from "react"

export default function CompanyPage({ params }: { params: { id: string } }) {

   const [companyFunctions, setCompanyFunctions] = useState([])
   const { } = useQuery(adminQueries.getCompnayFunctions, {
      skip: !params?.id,
      variables: {
         orgId: params.id
      },
      onSuccess: ({ data }) => {
         console.log(data, "data")
         setCompanyFunctions(data?.getCompnayFunctionsAdmin)
      },
   })

   return (
      <Card>
         <CardHeader>
            <h2 className="text-xl font-bold flex gap-2 items-center"><Building2 /> {params.id}</h2>
         </CardHeader>
         <CardContent>
            <DataTable columns={CompanyFunctionCols} data={companyFunctions ?? []} />
         </CardContent>
      </Card>
   )
}