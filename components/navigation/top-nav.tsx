import { Separator } from "../ui/separator";
import { UserAvatar } from "../user-avatar";
import { AlignJustify, CheckCircle2Icon } from "lucide-react";
import { SearchBar } from "./search-bar";

interface NavProps {
    isCollapsed: boolean;
    links: {
        title: string;
        label?: string;
        icon: React.ComponentType;
        variant: "default" | "ghost";
    }[];
}

export function TopNav({ toggle }: { toggle: () => void }) {

    return (
        <div
            className="group flex flex-col gap-4 "
        >
            <nav className="flex justify-between gap-1 px-5 p-2">
                <div className="flex space-x-4 cursor-pointer items-center" onClick={toggle}>
                    {/* <LorrigoLogo /> */}
                    <AlignJustify size={19} />

                </div>
                {/* <div className="px-10 w-full md:w-1/3">
                    <SearchBar
                        data={[
                            {
                                label: "TEST",
                                type: "TEST",
                                data: [{
                                    name: "TEST",
                                    id: "1",
                                    icon: <CheckCircle2Icon size={18} />,
                                    subBadgeText: "TEST",
                                }]
                            },
                        ]}
                    />
                </div> */}
                <div className="flex items-center space-x-4">

                    <Separator orientation="vertical" className="w-[1px] bg-gray-400" />

                    <UserAvatar />
                </div>
            </nav >
        </div >
    );
}