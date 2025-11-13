"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { useAuth } from "./providers/AuthProvider";
import { useAtom } from "jotai";
import { userAtom } from "@/lib/atom/userAtom";
import { ROOT, MANAGER, ADMIN } from "@/lib/role-constant";
import { usePathname } from "next/navigation";

export function UserAvatar() {
    const { logout } = useAuth()
    const [userInfo] = useAtom(userAtom)
    const pathname = usePathname()
    
    // Check if user is root_manager - users accessing root_manager routes (not /admin routes)
    // This includes ROOT, MANAGER, and Admin roles with companyId (company admins)
    const role = userInfo?.role?.name?.toLowerCase().replaceAll(" ", "") || "";
    const isSystemAdmin = pathname.startsWith("/admin");
    const isRootManager = !isSystemAdmin && (
        role === ROOT.toLowerCase() || 
        role === MANAGER.toLowerCase() || 
        (role === ADMIN.toLowerCase() && !!userInfo?.companyId) // Admin with companyId is root_manager
    );
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size={"icon"} className="relative h-8 w-8 rounded-full text-xl ">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="uppercase">
                            {/* <UserRoundIcon className="h-4 w-4" /> */}
                            {userInfo?.name?.split('')[0]}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userInfo?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userInfo?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {isRootManager && (
                        <>
                            <Link href="/settings">
                                <DropdownMenuItem>
                                    Settings
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/departments">
                                <DropdownMenuItem>
                                    Form Builder
                                </DropdownMenuItem>
                            </Link>
                        </>
                    )}
                    <DropdownMenuItem onClick={logout} className="text-red-500">
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuGroup>

            </DropdownMenuContent>
        </DropdownMenu >
    );
}
