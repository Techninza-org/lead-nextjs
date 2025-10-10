"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useMutation } from "graphql-hooks"
import { companyMutation } from "@/lib/graphql/company/mutation"
import { useToast } from "@/components/ui/use-toast"

export default function OtpManagement() {
   const [isOwnerOtp, setIsOwnerOtp] = useState(false)
   const [otpConfig] = useMutation(companyMutation.OTPCONFIG);
   const { toast } = useToast()

   const handleToggle = async (checked: boolean) => {
      setIsOwnerOtp(checked)

      try {
         const { data, error } = await otpConfig({
            variables: {
               isSendToEmp: checked
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
            title: "Department Form Updated Successfully!",
         });

      } catch (error) {
      }

   }

   return (
      <div className="container mx-auto py-10 space-y-3">
         <Card>
            <CardHeader>
               <CardTitle>OTP</CardTitle>
            </CardHeader>
            <CardContent>
               <Card>
                  <CardHeader>
                     <CardTitle>Send OTP to Owner or Employee</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="flex items-center space-x-2">
                        <Switch id="otp-recipient" checked={isOwnerOtp} onCheckedChange={handleToggle} />
                        <Label htmlFor="otp-recipient">{isOwnerOtp ? "Send OTP to Owner" : "Send OTP to Employee"}</Label>
                     </div>
                  </CardContent>
               </Card>
            </CardContent>
         </Card>
      </div>
   )
}

