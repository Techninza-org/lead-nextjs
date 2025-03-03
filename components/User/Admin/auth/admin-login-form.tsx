"use client"
import { useEffect, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AdminloginViaPhoneFormSchema } from "@/types/auth"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useMutation } from "graphql-hooks"
import { useAuth } from "@/components/providers/AuthProvider"

import { GENRATE_OTP, LOGIN_USER } from "@/lib/graphql/user/mutations"


export const AdminLoginForm = () => {
    const [isOTPFormVisible, setIsOTPFormVisible] = useState(false)
    const [timer, setTimer] = useState(0)
    const { handleUserLogin } = useAuth()

    const [loginUser, { loading }] = useMutation(LOGIN_USER);
    const [generateOTP, { loading: genratingOTP }] = useMutation(GENRATE_OTP);

    const form = useForm<z.infer<typeof AdminloginViaPhoneFormSchema>>({
        resolver: zodResolver(AdminloginViaPhoneFormSchema),
        defaultValues: {
            phone: "",
            otp: "",
        },
    })

    const { setError, getValues } = form

    const onSubmit = async (data: z.infer<typeof AdminloginViaPhoneFormSchema>) => {
        const { data: value, error } = await loginUser({
            variables: {
                phone: data.phone,
                otp: data.otp,
            },
        })
        handleUserLogin({ user: value?.loginUser?.user, error: error })
    }

    const genrateOTP = async () => {
        const phoneValue = getValues('phone');

        if (phoneValue.length === 10) {
            const { error } = await generateOTP({
                variables: {
                    phone: phoneValue
                }
            })
            if (error) {
                const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ")
                setError('phone', {
                    type: 'manual',
                    message: message || "Something went wrong",
                });
                return;
            }
            setIsOTPFormVisible(true);
            setTimer(45);
        } else {
            setError('phone', {
                type: 'manual',
                message: 'Please enter a valid 10-digit phone number',
            });
        };
    }

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {!isOTPFormVisible ? <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">Phone</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="bg-zinc-100/50 border-0 dark:bg-zinc-700 dark:text-white focus-visible:ring-slate-500 focus-visible:ring-1 text-black focus-visible:ring-offset-0"
                                            placeholder="Enter Phone"
                                            disabled={loading}
                                            {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" disabled={genratingOTP} onClick={() => genrateOTP()} className="mt-6 w-full">Send OTP</Button>
                    </div> : <OTPForm form={form} timer={timer} setTimer={setTimer} resendOTP={genrateOTP} />}
                </form>
            </Form>

        </>
    )
}

const OTPForm = ({ form, timer, setTimer, resendOTP }: { form: any, timer: number, setTimer: any, resendOTP: any }) => {

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev: number) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer, setTimer]);

    return (
        <>
            <div>
                <p className="text-xs mb-3">OTP has been successfully, Sent on you mobile <span className="text-green-500">+91 {form.watch("phone")}</span></p>
                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>One-Time Password</FormLabel>
                            <FormControl>
                                <InputOTP
                                    className="mx-auto"
                                    maxLength={6}
                                    {...field}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </FormControl>
                            <FormDescription>
                                Please enter the one-time password sent to your phone.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="submit" className="mt-6 w-full">Login</Button>
            <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={timer > 0}
                onClick={resendOTP}
            >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
            </Button>
        </>
    )
}