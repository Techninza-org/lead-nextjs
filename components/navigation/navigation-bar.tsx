"use client";

import { Nav } from "./nav";
import { HandCoins, HandIcon, Home, MapPin, Settings, ShoppingCart, TrendingUpIcon, Truck, User, LucideSettings, FileTextIcon } from "lucide-react";
import { TopNav } from "./top-nav";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { userAtom } from "@/lib/atom/userAtom";
import { MANAGER, ROOT, ADMIN } from "@/lib/role-constant";
import { ADMIN_NAV_LINKS, MANAGER_NAV_LINKS, ROOT_NAV_LINKS } from "@/lib/navigation-route";
import { useCompany } from "../providers/CompanyProvider";
import { usePermissions } from "../providers/PermissionContext";
import { newbuildHierarchy } from "@/lib/navigation-utils";
import { NestedSidebar } from "../nested-sidebar";


export function NavigationBar({ children }: { children: React.ReactNode }) {
    const { companyForm } = useCompany()
    const { allowedPermission } = usePermissions()
    const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    
    const handleNavToggle = () => {
        setIsNavCollapsed(!isNavCollapsed);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const employeeRoutes = allowedPermission.filter((perm: any) => perm.name.includes("VIEW") && !perm.name.includes("Lead") && !perm.name.includes("Prospect"))

    const [user] = useAtom(userAtom)
    const role = user?.role?.name?.toLowerCase().replaceAll(" ", "") || "";

    const { companyDeptFields } = useCompany();

    const pathname = usePathname();
    const isAdmin = pathname.startsWith("/admin");
    
    // Transform companyForm to include category information for the hierarchy
    const formattedCompanyDeptFields = companyDeptFields.map((item: any) => {
        // Find the category from companyForm based on name match
        const formItem = companyForm?.find((form: any) => form.name === item.name);
        return {
            ...item,
            category: formItem?.category || { name: "Uncategorized" }
        };
    });
    
    // Build hierarchy with category information
    const hierarchy = newbuildHierarchy(formattedCompanyDeptFields);
    
    const rootLinks = companyForm?.map((form: any) => ({
        title: form.name,
        icon: FileTextIcon,
        href: `/values/${form.name}`,
        category: form.category?.name // Include category in links
    })).filter((form: any) => !["LEAD", "PROSPECT", "LEAD FOLLOW UP", "PROSPECT FOLLOW UP"].includes(String(form.title).toUpperCase()));

    const extendRootLinks = [...ROOT_NAV_LINKS, ...rootLinks];

    const extendedEmployeeRoutes = employeeRoutes.map((route: any) => {
        const routeNameParts = route.name.split(":");
        const routePart = routeNameParts.length > 1 ? routeNameParts[1] : route.name;

        return {
            title: routePart,
            icon: FileTextIcon,
            href: `/${role}/values/${routePart}`,
        };
    });

    const EMP_NAV_LINKS = [
        {
            title: "Lead",
            icon: Truck,
            href: `/${role}/leads`,
        },
        {
            title: "Prospect",
            icon: Truck,
            href: `/${role}/prospects`,
        },
        ...extendedEmployeeRoutes,
    ];

    const navLinks = [ROOT].includes(role) ? ADMIN_NAV_LINKS : [ADMIN].includes(role) ? extendRootLinks : [MANAGER].includes(role) ? MANAGER_NAV_LINKS : EMP_NAV_LINKS;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsNavCollapsed(true);
            } else {
                setIsNavCollapsed(false);
            }
        };

        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <div className="z-50">
                <div className="fixed bottom-0 w-full bg-[#1e2035] z-50 text-white border-b border-gray-700">
                    <TopNav toggle={handleNavToggle} onSearch={handleSearch} />
                </div>
                <div
                    className={cn(
                        "fixed z-10 h-full flex flex-col transition-all duration-300 ease-in-out bg-[#1e2035] items-center text-white",
                        {
                            'w-64': !isNavCollapsed,
                            'w-0': isNavCollapsed,
                            'opacity-100': !isNavCollapsed,
                            'opacity-0': isNavCollapsed,
                        }
                    )}
                >
                    <Nav isCollapsed={isNavCollapsed} links={navLinks} />
                    {/* Pass the hierarchy with category information */}
                    {/* <NestedSidebar data={hierarchy} searchTerm={searchTerm} /> */}
                </div>
                <div
                    className={cn(
                        "transition-all w-full duration-300 ease-in-out pt-5 pb-10 md:px-4",
                        {
                            'ml-64 md:ml-0 md:pl-[17rem]': !isNavCollapsed,
                        }
                    )}
                >
                    {children}
                </div>
            </div>
        </>
    );
}