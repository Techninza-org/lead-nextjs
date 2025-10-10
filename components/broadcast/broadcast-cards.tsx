'use client'
import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { PlusCircle, TrashIcon, X } from 'lucide-react'
import { useModal } from '@/hooks/use-modal-store'
import { useMutation, useQuery } from 'graphql-hooks'
import { companyQueries } from '@/lib/graphql/company/queries'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/lib/atom/userAtom'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { companyMutation } from '@/lib/graphql/company/mutation'
import { useToast } from '../ui/use-toast'
import { LOGIN_USER } from '@/lib/graphql/user/mutations'
import { Card } from '../ui/card'
import { useCompany } from '../providers/CompanyProvider'

const BroadcastCards = () => {
    const [selectedCategory, setSelectedCategory] = React.useState('All')
    const user = useAtomValue(userAtom)

    const { companyForm } = useCompany()
    const braodcasteForm = companyForm?.find((form: any) => form.name === 'Broadcast')

    const { onOpen } = useModal();
    const { toast } = useToast();

    const [deleteBroadcast] = useMutation(companyMutation.DELETE_BROADCAST);

    const { loading, error, data } = useQuery(companyQueries.GET_BROADCASTS, {
        skip: !user?.token,
        refetchAfterMutations: [
            {
                mutation: companyMutation.DELETE_BROADCAST
            },
            {
                mutation: LOGIN_USER
            },
        ]
    });



    const filteredData = data?.getBroadcasts?.filter((broadcast: any) => {
        if (selectedCategory === 'All') return true
        if (selectedCategory === 'Offer') return broadcast.isOffer
        if (selectedCategory === 'Template') return broadcast.isTemplate
        if (selectedCategory === 'Message') return broadcast.isMessage
        return
    })

    const handleDelete = async (id: string) => {
        try {
            const { data, error } = await deleteBroadcast({
                variables: {
                    broadcastId: id
                }
            })
            if (error) {
                const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
                toast({
                    title: 'Error',
                    description: message || "Something went wrong",
                    variant: "destructive"
                });
                return;
            }
            toast({
                variant: "default",
                title: "Broadcast Deleted Successfully!",
            });
        } catch (error) {
        }
    }

    if (loading) return <p>Loading...</p>;

    return (
        <>
            <div className='flex justify-between mb-6'>
                <Select
                    onValueChange={(value) => {
                        setSelectedCategory(value)
                    }}
                >
                    <SelectTrigger
                        className="w-1/5 bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                    >
                        <SelectValue placeholder="Filter By Category" />
                    </SelectTrigger>
                    <SelectContent
                        className="bg-zinc-100 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                    >
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Template">Template</SelectItem>
                        <SelectItem value="Message">Message</SelectItem>
                    </SelectContent>
                </Select>
                {(user?.role?.name === 'Manager' || user?.role?.name === 'Root') && <Button size={'sm'} onClick={() => onOpen('createBroadcast', { broadcastForm: braodcasteForm })}> <PlusCircle size={15} className='mr-2' /> Add New Card</Button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">

                {filteredData?.map((broadcast: any) => (
                    <Card key={broadcast.id}>
                        <div className='flex float-end p-4'>
                            <X onClick={() => handleDelete(broadcast.id)} size={20} color='red' className='cursor-pointer' />
                        </div>
                        <div className=" cursor-pointer p-4 flex" onClick={() => onOpen('broadcastDetails', { broadcastId: broadcast.id })}>
                            <div className="flex-shrink-0 w-1/3 pr-4">
                                <img src={broadcast.imgURL[0].url} alt="broadcast" className="w-full h-32 object-cover rounded-lg" />
                            </div>
                            <div className="flex-grow">
                                <h2 className='font-bold'>TYPE</h2>
                                {broadcast.isOffer && <h3 className="text-lg ">Offer</h3>}
                                {broadcast.isMessage && <h3 className="text-lg ">Message</h3>}
                                {broadcast.isTemplate && <h3 className="text-lg ">Template</h3>}
                                <br />
                                <h2 className='font-bold'>DESCRIPTION</h2>
                                <h3 className="text-lg break-words">
                                    {broadcast.message.split(" ").slice(0, 4).join(" ") + (broadcast.message.split(" ").length > 4 ? "..." : "")}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

        </>
    )
}

export default BroadcastCards