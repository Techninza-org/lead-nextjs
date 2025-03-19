"use client"

import { Separator } from "../ui/separator";
import { UserAvatar } from "../user-avatar";
import { AlignJustify, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";

interface TopNavProps {
    toggle: () => void;
    onSearch: (term: string) => void;
}

export function TopNav({ toggle, onSearch }: TopNavProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const toggleSearch = () => {
        setShowSearch(!showSearch);
        if (!showSearch) {
            // Focus input when search is shown
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            // Clear search when hiding
            setSearchTerm("");
            onSearch("");
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    // Handle ESC key to close search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showSearch) {
                toggleSearch();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showSearch]);

    return (
        <div className="group flex flex-col gap-4">
            <nav className="flex justify-between gap-1 px-5 p-2">
                <div className="flex items-center space-x-4">
                    <AlignJustify size={19} onClick={toggle} className="cursor-pointer" />

                    <div className="relative">
                        {/* Search icon that opens the input */}
                        {!showSearch && (
                            <Search
                                size={19}
                                className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                                onClick={toggleSearch}
                            />
                        )}

                        {/* Animated search input container */}
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 flex items-center transition-all duration-300 ease-in-out",
                                showSearch ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"
                            )}
                        >
                            <div className="relative w-full flex items-center">
                                {/* Search icon inside input */}
                                <Search
                                    size={16}
                                    className="absolute left-2 text-gray-400 pointer-events-none"
                                />

                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search navigation..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full bg-[#2a2d46] border-[#2a2d46] text-white pl-8 pr-8 placeholder:text-gray-400 rounded-md"
                                />

                                {/* Close button inside input */}
                                <X
                                    size={16}
                                    className="absolute right-2 text-gray-400 hover:text-white cursor-pointer transition-colors"
                                    onClick={toggleSearch}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <SearchBar
                    data={{
                        data: [],
                        pagination: { page: 1, limit: 10, totalResults: 0, totalPages: 1 },
                        tableBreakdown: []
                    }}
                />

                <div className="flex items-center">
                    <Separator orientation="vertical" className="w-[1px] bg-gray-400" />
                    <div className="ml-4">
                        <UserAvatar />
                    </div>
                </div>
            </nav>
        </div>
    );
}