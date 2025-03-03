"use client"

import React from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import ActionTooltip from "../action-tooltip"
import { usePathname } from "next/navigation"

interface NavProps {
  isCollapsed: boolean
  links: {
    title: string
    label?: string
    icon: LucideIcon
    href?: string
    subLinks?: {
      title: string
      href: string
    }[]
  }[]
}

export function Nav({ links, isCollapsed }: NavProps) {
  const pathname = usePathname()
  const [openDropdownIndex, setOpenDropdownIndex] = React.useState<number | null>(null)

  const isActive = (href: string) => {
    return pathname.includes(href.toLowerCase()) ? "default" : "ghost"
  }

  const handleDropdownToggle = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index)
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col h-[calc(100vh-4rem)] justify-end pb-4 data-[collapsed=true]:py-2 w-full"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {
          links.map((link, index) => {
            const isDropdownOpen = openDropdownIndex === index
            const DropDownToggleIcon = isDropdownOpen ? ChevronUp : ChevronDown

            return isCollapsed ? (
              <ActionTooltip
                key={index}
                side="right"
                align="center"
                label={link.title}
              >
                {link.href ? (
                  <Link
                    href={link.href || "/"}
                    className={cn(
                      buttonVariants({ variant: isActive(link.href || ""), size: "icon" }),
                      "h-9 md:w-9",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="sr-only capitalize">{link.title}</span>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant={isActive(link.title)}
                    size="icon"
                    className="h-9 w-9"
                  >
                    <link.icon className="h-4" />
                    <span className="sr-only capitalize">{link.title}</span>
                  </Button>
                )}
              </ActionTooltip>
            ) : (
              <React.Fragment key={index}>
                {link.href ? (
                  <Link
                    href={link.href}
                    className={cn(
                      buttonVariants({ variant: isActive(link.href || ""), size: "sm" }),
                      "justify-start capitalize"
                    )}
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.title}
                    {link.label && (
                      <span className="ml-auto">
                        {link.label}
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="relative inline-block text-left">
                    <Button
                      type="button"
                      variant={isActive(link.title || "")}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleDropdownToggle(index)}
                    >
                      <link.icon className="mr-2 h-4 w-4" /> {link.label || link.title}
                      <DropDownToggleIcon className="h-4 w-4 ml-auto transition-all" />
                    </Button>
                    <div
                      className={cn(
                        "overflow-hidden transition-[max-height] duration-300 ease-in-out rounded-md mx-2",
                        {
                          "max-h-0": !isDropdownOpen,
                          "max-h-96": isDropdownOpen,
                        }
                      )}
                    >
                      <div className="py-1" role="none">
                        {link.subLinks?.map((subLink, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subLink.href}
                            className={cn(
                              buttonVariants({ variant: isActive(subLink.href || ""), size: "sm" }),
                              "justify-start w-full bg-opacity-50"
                            )}
                          >
                            {subLink.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })
        }
      </nav>
    </div>
  )
}