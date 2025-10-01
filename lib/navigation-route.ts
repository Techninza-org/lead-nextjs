import { FileTextIcon, HandCoins, Home, Pencil, Pin, Settings, UsersRoundIcon, Activity } from "lucide-react";

export const ROOT_NAV_LINKS = [
    {
        title: "Home",
        icon: Home,
        href: "/dashboard",
    },
    {
        title: "Prospects",
        icon: FileTextIcon,
        href: "/prospects",
    },
    {
        title: "Leads",
        icon: FileTextIcon,
        href: "/leads",
    },
    {
        title: "Members",
        icon: UsersRoundIcon,
        href: "/members",
    },
    {
        title: "Form Builder",
        icon: Pencil,
        href: "/departments",
    },
    // {
    //     title: "Follow Up",
    //     icon: Pencil,
    //     href: "/follow-up",
    // },
    // {
    //     title: "Bids",
    //     icon: Pencil,
    //     href: "/bids",
    // },
    // {
    //     title: "Exchange Vehicle Images",
    //     icon: Pencil,
    //     href: "/xchange-customer-list",
    // },
    // {
    //     title: "Exchange Document",
    //     icon: Pencil,
    //     href: "/lead-imgs",
    // },
    // {
    //     title: "Payments",
    //     icon: Pencil,
    //     href: "/pay-receipt",
    // },
    // {
    //     title: "Assign Lead",
    //     icon: ShoppingCart,
    //     subLinks: [
    //         {
    //             title: "Forward Orders",
    //             href: "/orders",
    //         },
    //         {
    //             title: "Reverse Orders",
    //             href: "/orders/reverse",
    //         },
    //         {
    //             title: "B2B Orders",
    //             href: "/orders/b2b",
    //         },
    //     ],
    // },
];

export const MANAGER_NAV_LINKS = [
    {
        title: "Home",
        icon: Home,
        href: "/dashboard",
    },
    {
        title: "Leads",
        icon: FileTextIcon,
        href: "/leads",
    },
    {
        title: "Prospect",
        icon: FileTextIcon,
        href: "/prospects",
    },
    // {
    //     title: "Leads",
    //     icon: FileTextIcon,
    //     href: "/leads/transfered",
    // },
    {
        title: "Track Location",
        icon: Pin,
        href: "/track",
    },
    {
        title: "Broadcast",
        icon: Pin,
        href: "/broadcast",
    }
    // {
    //     title: "Assign Lead",
    //     icon: ShoppingCart,
    //     subLinks: [
    //         {
    //             title: "Forward Orders",
    //             href: "/orders",
    //         },
    //         {
    //             title: "Reverse Orders",
    //             href: "/orders/reverse",
    //         },
    //         {
    //             title: "B2B Orders",
    //             href: "/orders/b2b",
    //         },
    //     ],
    // },
];

export const ADMIN_NAV_LINKS = [
    {
        title: "Home",
        icon: Home,
        href: "/admin/dashboard",
    },
    {
        title: "Companies",
        icon: FileTextIcon,
        href: "/admin/companies",
    },
    {
        title: "Logs",
        icon: Activity,
        href: "/admin/logs",
    },
]