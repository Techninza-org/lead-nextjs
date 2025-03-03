"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCompany } from "../providers/CompanyProvider"
import { useMutation } from "graphql-hooks"
import { adminQueries } from "@/lib/graphql/admin/queries"
import { useToast } from "../ui/use-toast"

export function AssignFormToRoot() {
   const [openSource, setOpenSource] = React.useState(false)
   const [openTarget, setOpenTarget] = React.useState(false)
   const [sourceValue, setSourceValue] = React.useState("")
   const [targetValue, setTargetValue] = React.useState("")
   const { rootInfo } = useCompany()
   const { toast } = useToast()
   const [assignFormC2C] = useMutation(adminQueries.ASSIGNFORMTOROOT);

   const roots = React.useMemo(() =>
      rootInfo?.map((root: any) => ({
         value: root.id,
         label: root.name,
      })) || [],
      [rootInfo]
   )

   React.useEffect(() => {
      if (roots.length > 0 && !sourceValue) {
         setSourceValue(roots[0].value)
      }
   }, [roots, sourceValue])

   const handleCopyFields = async () => {
      if (sourceValue && targetValue) {

         try {
            const { data, error } = await assignFormC2C({
               variables: {
                  sourceValue: sourceValue,
                  destinationRootId: targetValue
               },
            });

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
               title: `Copyied fields from ${sourceValue} to ${targetValue} Successfully!"`,
            });

         } catch (error) {
            console.log(error);
         }
      }
   }

   return (
      <div className="p-6 bg-white rounded-lg">
         <div className="flex items-center gap-4">
            {/* Source Combobox */}
            <Popover open={openSource} onOpenChange={setOpenSource}>
               <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openSource} className="w-[200px] justify-between">
                     {sourceValue ? roots.find((root) => root.value === sourceValue)?.label : "Select Company..."}
                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[200px] p-0">
                  <Command>
                     <CommandInput placeholder="Search Company..." />
                     <CommandList>
                        <CommandEmpty>No Company found.</CommandEmpty>
                        <CommandGroup>
                           {roots.map((root) => (
                              <CommandItem
                                 key={root.value}
                                 value={root.value}
                                 onSelect={(currentValue) => {
                                    setSourceValue(currentValue === sourceValue ? "" : currentValue)
                                    setOpenSource(false)
                                 }}
                              >
                                 <Check className={cn("mr-2 h-4 w-4", sourceValue === root.value ? "opacity-100" : "opacity-0")} />
                                 {root.label}
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     </CommandList>
                  </Command>
               </PopoverContent>
            </Popover>

            {/* Arrow indicating field copying */}
            <div className="flex items-center justify-center">
               <svg width="40" height="12">
                  <path d="M0 6 L40 6" stroke="#f59e0b" strokeWidth="2" fill="none" />
                  <path d="M35 2 L40 6 L35 10" stroke="#f59e0b" strokeWidth="2" fill="none" />
               </svg>
            </div>

            {/* Target Combobox */}
            <Popover open={openTarget} onOpenChange={setOpenTarget}>
               <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openTarget} className="w-[200px] justify-between">
                     {targetValue ? roots.find((root) => root.value === targetValue)?.label : "Select Company..."}
                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[200px] p-0">
                  <Command>
                     <CommandInput placeholder="Search Company..." />
                     <CommandList>
                        <CommandEmpty>No Company found.</CommandEmpty>
                        <CommandGroup>
                           {roots.map((root) => (
                              <CommandItem
                                 key={root.value}
                                 value={root.value}
                                 onSelect={(currentValue) => {
                                    setTargetValue(currentValue === targetValue ? "" : currentValue)
                                    setOpenTarget(false)
                                    // if (sourceValue && currentValue) {
                                    //    handleCopyFields()
                                    // }
                                 }}
                              >
                                 <Check className={cn("mr-2 h-4 w-4", targetValue === root.value ? "opacity-100" : "opacity-0")} />
                                 {root.label}
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     </CommandList>
                  </Command>
               </PopoverContent>
            </Popover>

            <Button size={'sm'} onClick={handleCopyFields}>Submit</Button>
         </div>
      </div>
   )
}

