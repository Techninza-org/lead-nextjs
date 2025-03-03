import React from 'react'

import AdvancedDataTable from '../Table/advance-table/advance-data-table'
import { formatDyamicTableData } from '@/lib/utils'

const FollowUpsData = ({ lead }: { lead: any }) => {
  const followUpData = lead?.followUps

  const data = formatDyamicTableData(followUpData)
  if(!data) return null

  return (
    <AdvancedDataTable
      columnNames={data.cols.columnNames as any}
      data={data.rows as any}
      showTools={false}
    />
  )
}

export default FollowUpsData