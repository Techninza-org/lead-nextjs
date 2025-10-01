'use client'
import React, { use, useEffect, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { format } from 'date-fns'
import { CalendarDaysIcon } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { DirectionMap } from './map'
import { useCompany } from './providers/CompanyProvider'
import { useQuery } from 'graphql-hooks'
import { userQueries } from '@/lib/graphql/user/queries'

const Track = () => {
    const { userInfo } = useCompany()
    const [selectedMember, setSelectedMember] = useState(null)
    const [date, setDate] = useState(null)
    const [show, setShow] = useState(false)

    const { data: membersData, loading: membersLoading, error: membersError } = useQuery(userQueries.GET_ALL_COMPANY_MEMBERS, {
        variables: {
            companyId: userInfo?.companyId,
        },
        skip: !userInfo?.companyId,
    })

    const members = membersData?.getCompanyDeptMembers || []
    console.log('members:', members)

    function handleTrack() {
        setShow(true)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold">Track</h1>
            <div className='my-6 flex gap-8'>
                <Select onValueChange={(value: any) => setSelectedMember(value)}>
                    <SelectTrigger className="w-1/4 bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0">
                        <SelectValue placeholder={membersLoading ? "Loading members..." : "Select Member"} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white">
                        {membersLoading ? (
                            <div className="p-2 text-sm text-gray-500">Loading members...</div>
                        ) : membersError ? (
                            <div className="p-2 text-sm text-red-500">Error loading members</div>
                        ) : members?.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No members found</div>
                        ) : (
                            members?.map((member: any) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.name} - {member.role?.name} {member.dept?.name ? `(${member.dept.name})` : ''}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal")}>
                            {date ? format(date, "PPP") : <span>Pick A Date</span>}
                            <CalendarDaysIcon className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date as any || null}
                            onSelect={(date) => setDate(date as any)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleTrack} disabled={!date || !selectedMember || show}>Track</Button>
                <Button variant={"destructive"} onClick={() => window.location.reload()} disabled={!show} >Stop</Button>
            </div>
            {show && <DirectionMap memberId={selectedMember || ''} date={date} />}
        </div>
    )
}

export default Track