"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useQuery } from "graphql-hooks"
import { PlusCircleIcon } from "lucide-react"

import AdvancedDataTable from "@/components/Table/advance-table/advance-data-table"
import { useCompany } from "@/components/providers/CompanyProvider"
import { useModal } from "@/hooks/use-modal-store"
import { companyQueries } from "@/lib/graphql/company/queries"
import { updateDependentFields } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Page({ params }: { params: { formName: string } }) {
  const formName   = decodeURIComponent(params.formName)
  const router     = useRouter()
  const searchParams = useSearchParams()
  const pathname   = usePathname()

  // pull page & sort from URL
  const urlPage    = Number(searchParams.get("page") || "1")
  const urlSort    = searchParams.get("sort") || ""

  const [page, setPage]         = useState(urlPage)
  const [sortParam, setSortParam] = useState(urlSort)
  const limit                  = 50

  const { data, loading, error, refetch } = useQuery(
    companyQueries.GET_SUBMITTED_FORM_VALUE,
    {
      variables: { formName, filters: {}, page, limit, sort: sortParam },
      notifyOnNetworkStatusChange: true,
    }
  )

  // unpack our new payload
  const {
    listView    = [],
    changeView  = [],
    data: rows  = [],
    pagination  = { total: 0, page: 1, limit, totalPages: 0 },
  } = data?.getFormValuesByFormName || {}

  // helper to push new page/sort into URL + replace
  const updateUrl = (newPage: number, newSort: string) => {
    const qp = new URLSearchParams(searchParams.toString())
    qp.set("page", newPage.toString())
    if (newSort) qp.set("sort", newSort)
    else qp.delete("sort")
    router.replace(`${pathname}?${qp.toString()}`, { scroll: false })
  }

  // called by pagination controls
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateUrl(newPage, sortParam)
    refetch({ formName, filters: {}, page: newPage, limit, sort: sortParam })
  }

  // called by clicking on sortable headers
  const updateSortInUrl = (idx: number, desc: boolean | null) => {
    const currentSort = sortParam
    let sortArray = currentSort ? currentSort.split(",") : []
    const columnIndex = idx + 1
    const columnSort  = sortArray.find(s => Math.abs(parseInt(s)) === columnIndex)

    if (desc === null) {
      sortArray = sortArray.filter(s => Math.abs(parseInt(s)) !== columnIndex)
    } else if (columnSort) {
      sortArray = sortArray.map(s =>
        Math.abs(parseInt(s)) === columnIndex
          ? (desc ? `-${columnIndex}` : `${columnIndex}`)
          : s
      )
    } else {
      sortArray.push(desc ? `-${columnIndex}` : `${columnIndex}`)
    }

    const newSort = sortArray.join(",")
    setSortParam(newSort)
    updateUrl(1, newSort)
    setPage(1)
    refetch({ formName, filters: {}, page: 1, limit, sort: newSort })
  }

  // data‐entry modal button
  const forms = updateDependentFields(useCompany().companyDeptFields || [])
  const formateFields = useMemo(
    () => forms.find(x => x.name === formName) || [],
    [forms, formName]
  )
  const { onOpen } = useModal()
  const MoreInfoLead = useCallback(({ selectedLeads }: { selectedLeads: any[] }) => (
    <div className="flex gap-2 ml-auto">
      <Button
        onClick={() => onOpen("submitLead", { fields: formateFields })}
        variant="default"
        size="sm"
      >
        <PlusCircleIcon size={15} /> <span>Add New {formName}</span>
      </Button>
    </div>
  ), [formName, formateFields, onOpen])

  return (
    <Card className="w-full max-w-3xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-700">
          {formName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdvancedDataTable
          dependentCols={[]}
          columnNames={listView}
          changeView={changeView}
          data={rows}
          pagination={pagination}
          tableName={formName}
          MoreInfo={MoreInfoLead}
          sortParam={sortParam}
          updateSortInUrl={updateSortInUrl}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  )
}
