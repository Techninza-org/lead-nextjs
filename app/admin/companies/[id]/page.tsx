
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/DataTable"
import { CompaniesFunctionsDataTable } from "@/components/User/Admin/admin-companies-list-table"
import { CompanyFunctionCols } from "@/components/User/Admin/companies-list-col"
import { RootTable } from "@/components/User/Admin/root-table"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { useQuery } from "graphql-hooks"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CompanyPage({ params }: { params: { id: string } }) {

   const [companyFunctions, setCompanyFunctions] = useState([])
   const { } = useQuery(adminQueries.getCompnayFunctions, {
      skip: !params?.id,
      variables: {
         orgId: params.id
      },
      onSuccess: ({ data }) => {
         setCompanyFunctions(data?.getCompnayFunctionsAdmin)
      },
   })

   return (
      <Card>
         <CardHeader >
            <div className=" flex justify-between">
               <h2 className="text-xl font-bold flex gap-2 items-center"><Building2 /> {params.id}</h2>
               <Link href={`/admin/companies/function/${params.id}`} className="text-blue-800 hover:underline">
                  <Button variant={"default"}>
                    Create Function
                  </Button>
               </Link>
            </div>
         </CardHeader>
         <CardContent>
            <CompaniesFunctionsDataTable columns={CompanyFunctionCols} data={companyFunctions}/>
         </CardContent>
      </Card>
   )
}