import { z } from "zod"

export const signupFormSchema = z.object({
    name: z.string().min(3, 'Please enter your name.'),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    password: z.string().min(3, 'Please enter your password.').min(8, 'Your password must have 8 characters or more.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),

    roleId: z.string().optional(),
    deptId: z.string().optional(),
    companyId: z.string().optional(),

    companyName: z.string().min(3, "Please the Company Name"),
    companyAddress: z.string().min(3, "Please the Company Address"),
    companyPhone: z.string().min(3, "Please the Company Phone Number"),
    companyEmail: z.string().min(3, "Please the Company Email Address").email("Please enter a valid email address"),

})

export const loginViaPhoneFormSchema = z.object({
    orgId: z.string().min(3, 'Please enter your organization ID.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    otp: z.string().length(6, 'Please enter a valid OTP.'),
})

export const AdminloginViaPhoneFormSchema = z.object({
    // orgId: z.string().min(3, 'Please enter your organization ID.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    otp: z.string().length(6, 'Please enter a valid OTP.'),
})

export const loggedUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    sessionToken: z.string(),
    token: z.string(),
    phone: z.string(),
    role: z.object({
        id: z.string(),
        name: z.string(),
    }),
    deptId: z.string(),
    companyId: z.string(),
})

export const createCompanyMemberSchema = z.object({
    id: z.string().optional(),
    role: z.object({
        name: z.string(),
    }).optional(),

    name: z.string().min(3, 'Please enter your name.'),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    roleId: z.string().min(3, 'Please select a role.'),
    deptId: z.string().min(3, 'Please select a role.'),
    companyId: z.string().optional(),
})

export const createUpdateManagerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Please enter your name.'),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    roleId: z.string().min(3, 'Please select a role.').optional(),
    deptId: z.string().min(3, 'Please select a role.'),
    companyId: z.string().optional(),
    type: z.string(),
})

export const createUpdateMemberSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Please enter your name.').optional(),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    phone: z.string().length(10, 'Please enter a valid phone number.').optional(),
    roleId: z.string().min(3, 'Please select a role.').optional(),
    deptId: z.string().min(3, 'Please select a role.').optional(),
    companyId: z.string().optional(),
})

