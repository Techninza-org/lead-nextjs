"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Users,
  UserCheck,
  Shield,
  FolderGit2,
  GitFork,
  Search,
  LayoutDashboard,
  FolderKanban,
  Activity,
  Globe,
  Smartphone,
  Archive,
  BookOpen,
  FileText,
  Code,
  Copy,
  Settings,
  User,
  Sliders,
  MapPin,
  type LucideIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ActionTooltip from "@/components/action-tooltip"

// Define the navigation item type with icon and category support
interface NavigationItem {
  name: string;
  icon?: string | LucideIcon;
  children: NavigationItem[];
  path?: string; // Custom path override
  category?: string; // Category name
}

// Define category group structure
interface CategoryGroup {
  name: string;
  items: NavigationItem[];
}

interface NestedSidebarProps {
  data: NavigationItem[];
  searchTerm?: string;
  isCollapsed?: boolean;
}

// Map of icon names to Lucide icon components
const iconMap: Record<string, LucideIcon> = {
  Folder,
  Users,
  UserCheck,
  Shield,
  FolderGit2,
  GitFork,
  LayoutDashboard,
  FolderKanban,
  Activity,
  Globe,
  Smartphone,
  Archive,
  BookOpen,
  FileText,
  Code,
  Copy,
  Settings,
  User,
  Sliders,
}

// Helper function to create URL-friendly slugs
function createSlug(name: string): string {
  return name.replace(/\s+/g, "-")
}

// Helper function to flatten the navigation tree for searching
function flattenNavigation(items: NavigationItem[]): NavigationItem[] {
  return items.reduce<NavigationItem[]>((acc, item) => {
    acc.push(item)
    if (item.children && item.children.length > 0) {
      acc.push(...flattenNavigation(item.children))
    }
    return acc
  }, [])
}

// Helper function to check if an item or any of its children match the search term
function itemMatchesSearch(item: NavigationItem, searchTerm: string): boolean {
  if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
    return true
  }
  
  if (item.children && item.children.length > 0) {
    return item.children.some(child => itemMatchesSearch(child, searchTerm))
  }
  
  return false
}

// Helper function to get all parent paths for a given item
function getParentPaths(
  items: NavigationItem[],
  targetName: string,
  currentPath: string[] = []
): string[] | null {
  for (const item of items) {
    const newPath = [...currentPath, item.name]
    
    if (item.name === targetName) {
      return newPath
    }
    
    if (item.children && item.children.length > 0) {
      const result = getParentPaths(item.children, targetName, newPath)
      if (result) {
        return result
      }
    }
  }
  
  return null
}

// Group items by category
function groupItemsByCategory(items: NavigationItem[]): CategoryGroup[] {
  const categoryMap: Record<string, NavigationItem[]> = {};
  
  // First populate the map
  items.forEach(item => {
    const category = item.category || "Uncategorized";
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(item);
  });
  
  // Convert the map to an array of category groups
  return Object.entries(categoryMap).map(([name, items]) => ({
    name,
    items
  }));
}

export function NestedSidebar({ data, searchTerm = "", isCollapsed = false }: NestedSidebarProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [searchResults, setSearchResults] = React.useState<NavigationItem[]>([])
  
  // Group items by category
  const categoryGroups = React.useMemo(() => groupItemsByCategory(data), [data]);
  
  // Update search results when search term changes from props
  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    
    const flattenedItems = flattenNavigation(data)
    const results = flattenedItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    setSearchResults(results)
    
    // Auto-expand parents of matching items
    const newExpandedItems = new Set<string>()
    const newExpandedCategories = new Set<string>()
    
    results.forEach(result => {
      const parentPaths = getParentPaths(data, result.name)
      if (parentPaths) {
        // Add all parent items except the last one (which is the result itself)
        parentPaths.slice(0, -1).forEach(parent => {
          newExpandedItems.add(parent)
        })
      }
      // Expand the category containing the result
      if (result.category) {
        newExpandedCategories.add(result.category)
      }
    })
    
    setExpandedItems(newExpandedItems)
    setExpandedCategories(newExpandedCategories)
  }, [searchTerm, data])

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    const newExpandedCategories = new Set(expandedCategories);
    if (expandedCategories.has(categoryName)) {
      newExpandedCategories.delete(categoryName);
    } else {
      newExpandedCategories.add(categoryName);
    }
    setExpandedCategories(newExpandedCategories);
  };

  return (
    <div 
      data-collapsed={isCollapsed}
      className="group flex flex-col h-[calc(100vh-4rem)] justify-end pb-4 data-[collapsed=true]:py-2 w-full"
    >
        {!isCollapsed && (
          <div className="border-b border-gray-800 flex-shrink-0 flex flex-col gap-2 p-2 mb-auto">
            <div className="flex h-14 items-center px-4">
              <h2 className="text-lg font-semibold text-white">Lead Management</h2>
            </div>
          </div>
        )}
        
        {/* Navigation menu */}
        <div className="w-full px-2">
          <div className="relative flex w-full min-w-0 flex-col p-2">
            <div className="w-full text-sm">
              <ul className={cn("flex w-full min-w-0 flex-col gap-1", isCollapsed && "justify-center items-center", "group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2")}>
                  {/* Static Members Navigation */}
                  <li className="group/menu-item relative">
                    {isCollapsed ? (
                      <ActionTooltip side="right" align="center" label="Members">
                        <Link
                          href="/members"
                          className={cn(
                            buttonVariants({ 
                              variant: usePathname() === "/members" ? "default" : "ghost", 
                              size: "icon" 
                            }),
                            "h-9 w-9"
                          )}
                        >
                          <Users className="h-4 w-4" />
                          <span className="sr-only">Members</span>
                        </Link>
                      </ActionTooltip>
                    ) : (
                      <Link
                        href="/members"
                        className={`flex items-center px-2 py-1 text-sm text-gray-300 hover:text-white ${
                          usePathname() === "/members" ? "text-white bg-[#2a2d46] rounded-md" : ""
                        }`}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Members</span>
                      </Link>
                    )}
                  </li>
                  
                  {/* Static Track Navigation */}
                  <li className="group/menu-item relative">
                    {isCollapsed ? (
                      <ActionTooltip side="right" align="center" label="Track">
                        <Link
                          href="/track"
                          className={cn(
                            buttonVariants({ 
                              variant: usePathname() === "/track" ? "default" : "ghost", 
                              size: "icon" 
                            }),
                            "h-9 w-9"
                          )}
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="sr-only">Track</span>
                        </Link>
                      </ActionTooltip>
                    ) : (
                      <Link
                        href="/track"
                        className={`flex items-center px-2 py-1 text-sm text-gray-300 hover:text-white ${
                          usePathname() === "/track" ? "text-white bg-[#2a2d46] rounded-md" : ""
                        }`}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Track</span>
                      </Link>
                    )}
                  </li>
                  
                  {!isCollapsed && searchTerm.trim() !== "" && searchResults.length > 0 && (
                    <div className="px-2 py-2 text-sm text-gray-400">
                      Search results ({searchResults.length})
                    </div>
                  )}
                  
                  {!isCollapsed && searchTerm.trim() !== "" && searchResults.length === 0 && (
                    <div className="px-2 py-2 text-sm text-gray-400">
                      No results found
                    </div>
                  )}
                  
                  {searchTerm.trim() !== "" ? (
                    searchResults.map((item) => (
                      <SearchResultItem key={item.name} item={item} isCollapsed={isCollapsed} />
                    ))
                  ) : (
                    categoryGroups.map((category) => (
                      <CategoryGroupItem 
                        key={category.name}
                        category={category}
                        expandedItems={expandedItems}
                        setExpandedItems={setExpandedItems}
                        isExpanded={expandedCategories.has(category.name)}
                        toggleExpanded={() => toggleCategory(category.name)}
                        isCollapsed={isCollapsed}
                      />
                    ))
                  )}
              </ul>
            </div>
          </div>
        </div>
        
      </div>
  )
}

interface CategoryGroupItemProps {
  category: CategoryGroup;
  expandedItems: Set<string>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isCollapsed?: boolean;
}

function CategoryGroupItem({ 
  category, 
  expandedItems, 
  setExpandedItems,
  isExpanded,
  toggleExpanded,
  isCollapsed = false
}: CategoryGroupItemProps) {
  if (isCollapsed) {
    // When collapsed, show only the first item's icon as a representative
    const firstItem = category.items[0]
    let ItemIcon = Folder
    if (firstItem) {
      if (typeof firstItem.icon === 'string' && iconMap[firstItem.icon]) {
        ItemIcon = iconMap[firstItem.icon]
      } else if (typeof firstItem.icon !== 'string' && firstItem.icon) {
        ItemIcon = firstItem.icon
      }
    }
    
    return (
      <div className="mb-2">
        <ActionTooltip side="right" align="center" label={category.name}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleExpanded}
          >
            <ItemIcon className="h-4 w-4" />
            <span className="sr-only">{category.name}</span>
          </Button>
        </ActionTooltip>
      </div>
    )
  }
  
  return (
    <div className="mb-2">
      <Collapsible open={isExpanded} onOpenChange={toggleExpanded} className="w-full">
        <div 
          className="flex items-center px-2 py-2 cursor-pointer text-gray-200 bg-[#262940] hover:bg-[#2a2d46]"
          onClick={toggleExpanded}
        >
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 mr-2 text-gray-300" /> : 
            <ChevronRight className="h-4 w-4 mr-2 text-gray-300" />
          }
          <span className="font-medium text-xs uppercase tracking-wider">{category.name}</span>
        </div>
        <CollapsibleContent>
          <div className="ml-2">
            {category.items.map((item) => (
              <NavigationItem 
                key={item.name} 
                item={item} 
                level={0}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface NavigationItemProps {
  item: NavigationItem
  level: number
  expandedItems: Set<string>
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>
  isCollapsed?: boolean
}

function NavigationItem({ item, level, expandedItems, setExpandedItems, isCollapsed = false }: NavigationItemProps) {
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0
  
  // Check if this item is expanded
  const isOpen = expandedItems.has(item.name)
  
  // Toggle expansion state
  const toggleExpanded = () => {
    const newExpandedItems = new Set(expandedItems)
    if (isOpen) {
      newExpandedItems.delete(item.name)
    } else {
      newExpandedItems.add(item.name)
    }
    setExpandedItems(newExpandedItems)
  }

  // Get the icon for this item
  let ItemIcon = Folder
  if (typeof item.icon === 'string' && iconMap[item.icon]) {
    ItemIcon = iconMap[item.icon]
  } else if (typeof item.icon !== 'string' && item.icon) {
    ItemIcon = item.icon
  }

  // Generate the path for this item
  const itemPath = item.path || `/values/${createSlug(item.name)}`
  const isActive = pathname === itemPath

  if (isCollapsed) {
    return (
      <li className="group/menu-item relative">
        <ActionTooltip side="right" align="center" label={item.name}>
          <Link
            href={itemPath}
            className={cn(
              buttonVariants({ 
                variant: isActive ? "default" : "ghost", 
                size: "icon" 
              }),
              "h-9 w-9"
            )}
          >
            <ItemIcon className="h-4 w-4" />
            <span className="sr-only">{item.name}</span>
          </Link>
        </ActionTooltip>
      </li>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={toggleExpanded} className="w-full">
      <li className="group/menu-item relative">
        <div className="flex w-full items-center">
          <Link
            href={itemPath}
            className={`flex flex-1 items-center px-2 py-1 text-sm text-gray-300 hover:text-white ${
              isActive ? "text-white bg-[#2a2d46] rounded-md" : ""
            }`}
          >
            <ItemIcon className="mr-2 h-4 w-4" />
            <span>{item.name}</span>
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault()
                toggleExpanded()
              }}
              className="px-2 py-1 text-gray-400 hover:text-white"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <div className="ml-4">
              {item.children.map((child) => (
                <NavigationItem 
                  key={child.name} 
                  item={child} 
                  level={level + 1}
                  expandedItems={expandedItems}
                  setExpandedItems={setExpandedItems}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </li>
    </Collapsible>
  )
}

interface SearchResultItemProps {
  item: NavigationItem
  isCollapsed?: boolean
}

function SearchResultItem({ item, isCollapsed = false }: SearchResultItemProps) {
  const pathname = usePathname()
  
  // Get the icon for this item
  let ItemIcon = Folder
  if (typeof item.icon === 'string' && iconMap[item.icon]) {
    ItemIcon = iconMap[item.icon]
  } else if (typeof item.icon !== 'string' && item.icon) {
    ItemIcon = item.icon
  }

  // Generate the path for this item
  const itemPath = item.path || `/values/${createSlug(item.name)}`
  const isActive = pathname === itemPath

  if (isCollapsed) {
    return (
      <li className="group/menu-item relative">
        <ActionTooltip side="right" align="center" label={item.name}>
          <Link
            href={itemPath}
            className={cn(
              buttonVariants({ 
                variant: isActive ? "default" : "ghost", 
                size: "icon" 
              }),
              "h-9 w-9"
            )}
          >
            <ItemIcon className="h-4 w-4" />
            <span className="sr-only">{item.name}</span>
          </Link>
        </ActionTooltip>
      </li>
    )
  }

  return (
    <li className="group/menu-item relative">
      <Link
        href={itemPath}
        className={`flex items-center px-2 py-1 text-sm text-gray-300 hover:text-white ${
          isActive ? "text-white bg-[#2a2d46] rounded-md" : ""
        }`}
      >
        <ItemIcon className="mr-2 h-4 w-4" />
        <span>{item.name}</span>
        {item.category && (
          <span className="ml-2 text-xs bg-[#2a2d46] px-1 py-0.5 rounded text-gray-400">
            {item.category}
          </span>
        )}
      </Link>
    </li>
  )
}