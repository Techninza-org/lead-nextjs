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
  type LucideIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"

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
  return name.toLowerCase().replace(/\s+/g, "-")
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

export function NestedSidebar({ data, searchTerm = "" }: NestedSidebarProps) {
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
    <SidebarProvider>
      <Sidebar className="dark bg-[#1e2030] border-r pb-10 border-gray-800 flex flex-col h-full">
        <SidebarHeader className="border-b border-gray-800">
          <div className="flex h-14 items-center px-4">
            <h2 className="text-lg font-semibold text-white">Lead Management</h2>
          </div>
        </SidebarHeader>
        
        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>
        
        {/* Navigation menu */}
        <div className="w-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {searchTerm.trim() !== "" && searchResults.length > 0 ? (
                    <div className="px-2 py-2 text-sm text-gray-400">
                      Search results ({searchResults.length})
                    </div>
                  ) : null}
                  
                  {searchTerm.trim() !== "" && searchResults.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-gray-400">
                      No results found
                    </div>
                  ) : null}
                  
                  {searchTerm.trim() !== "" ? (
                    searchResults.map((item) => (
                      <SearchResultItem key={item.name} item={item} />
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
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </div>
        
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}

interface CategoryGroupItemProps {
  category: CategoryGroup;
  expandedItems: Set<string>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

function CategoryGroupItem({ 
  category, 
  expandedItems, 
  setExpandedItems,
  isExpanded,
  toggleExpanded
}: CategoryGroupItemProps) {
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
}

function NavigationItem({ item, level, expandedItems, setExpandedItems }: NavigationItemProps) {
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

  return (
    <Collapsible open={isOpen} onOpenChange={toggleExpanded} className="w-full">
      <SidebarMenuItem>
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
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

interface SearchResultItemProps {
  item: NavigationItem
}

function SearchResultItem({ item }: SearchResultItemProps) {
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

  return (
    <SidebarMenuItem>
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
    </SidebarMenuItem>
  )
}