"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, X, AlertCircle, ExternalLink, Eye, EyeOff, Filter } from "lucide-react";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "graphql-hooks";
import { adminQueries } from "@/lib/graphql/admin/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogsStats {
  overallStats: {
    totalErrors: number;
    totalRequests: number;
    totalBandwidth: number;
  };
  orgSummary: Array<{
    orgName: string;
    totalErrors: number;
    totalRequests: number;
    totalBandwidth: number;
  }>;
  userDetails: Array<{
    orgName: string;
    users: Array<{
      userId: string;
      userName?: string | null;
      totalErrors: number;
      totalRequests: number;
      totalBandwidth: number;
    }>;
  }>;
}

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  httpCode: number;
  description: string;
  elapsedTimeMs: number;
  ip: string;
  orgId: string;
  userId: string;
  userName?: string | null;
  rate: string;
  bandwidthKB: number;
  userAgent: string;
  payload: string;
  isError: boolean;
}

export default function LogsPage() {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(50);
  const [viewMode, setViewMode] = useState<"stats" | "detailed">("stats");
  
  // Filter states for all fields
  const [filters, setFilters] = useState<{
    method?: string;
    httpCode?: string;
    orgId?: string;
    userId?: string;
    url?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  // Combine date and time for queries - compute directly to ensure fresh values
  const startDateTime = useMemo(() => {
    const [hours, minutes] = startTime.split(':');
    const date = new Date(startDate);
    date.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0, 0);
    return date.toISOString();
  }, [startDate, startTime]);

  const endDateTime = useMemo(() => {
    const [hours, minutes] = endTime.split(':');
    const date = new Date(endDate);
    date.setHours(parseInt(hours || '23', 10), parseInt(minutes || '59', 10), 59, 999);
    return date.toISOString();
  }, [endDate, endTime]);

  // Memoize variables to ensure object reference changes when values change
  const statsVariables = useMemo(() => ({
    startDate: startDateTime,
    endDate: endDateTime,
  }), [startDateTime, endDateTime]);

  const detailedLogsVariables = useMemo(() => ({
    startDate: startDateTime,
    endDate: endDateTime,
    orgId: selectedOrgId || filters.orgId || undefined,
    userId: selectedUserId || filters.userId || undefined,
    page: currentPage,
    limit: logsPerPage,
    search: searchTerm || undefined,
    errorsOnly: errorsOnly,
  }), [startDateTime, endDateTime, selectedOrgId, filters.orgId, selectedUserId, filters.userId, currentPage, logsPerPage, searchTerm, errorsOnly]);

  // Query for logs statistics
  const { data: logsStats, loading: statsLoading, error: statsError } = useQuery(adminQueries.GET_LOGS_STATS, {
    variables: statsVariables,
  });

  // Query for detailed logs
  const { data: detailedLogsData, loading: detailedLogsLoading, error: detailedLogsError } = useQuery(
    adminQueries.GET_DETAILED_LOGS,
    {
      variables: detailedLogsVariables,
      skip: viewMode === "stats",
    }
  );

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    const allLogs = detailedLogsData?.getDetailedLogs?.logs || [];
    const stats = logsStats?.getLogAnalytics;
    
    // Create a map of userId to userName for display
    // First, populate from stats (which has user names)
    const userIdToNameMap = new Map<string, string>();
    const userIdsSet = new Set<string>();
    
    if (stats?.userDetails) {
      stats.userDetails.forEach((orgDetail: any) => {
        orgDetail.users?.forEach((user: any) => {
          if (user.userId) {
            userIdsSet.add(user.userId);
            if (!userIdToNameMap.has(user.userId)) {
              userIdToNameMap.set(user.userId, user.userName || user.userId);
            }
          }
        });
      });
    }
    // Then, populate from detailed logs (in case stats don't have all users)
    allLogs.forEach((log: LogEntry) => {
      if (log.userId) {
        userIdsSet.add(log.userId);
        if (!userIdToNameMap.has(log.userId)) {
          userIdToNameMap.set(log.userId, log.userName || log.userId);
        }
      }
    });
    
    return {
      methods: Array.from(new Set(allLogs.map((log: LogEntry) => String(log.method)))).sort() as string[],
      httpCodes: (Array.from(new Set(allLogs.map((log: LogEntry) => String(log.httpCode)))) as string[]).sort((a, b) => parseInt(a) - parseInt(b)),
      orgIds: Array.from(new Set(allLogs.map((log: LogEntry) => String(log.orgId)))).sort() as string[],
      userIds: Array.from(userIdsSet).sort() as string[],
      userIdToNameMap: userIdToNameMap as Map<string, string>,
      urls: Array.from(new Set(allLogs.map((log: LogEntry) => String(log.url)))).sort() as string[],
    };
  }, [detailedLogsData, logsStats]);

  // Filter logs based on selected filters
  const filteredLogs = useMemo(() => {
    const allLogs = detailedLogsData?.getDetailedLogs?.logs || [];
    return allLogs.filter((log: LogEntry) => {
      if (filters.method && log.method !== filters.method) return false;
      if (filters.httpCode && log.httpCode.toString() !== filters.httpCode) return false;
      if (filters.orgId && log.orgId !== filters.orgId) return false;
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.url && !log.url.includes(filters.url)) return false;
      return true;
    });
  }, [detailedLogsData, filters]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const toggleOrgExpansion = (orgName: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgName)) {
      newExpanded.delete(orgName);
    } else {
      newExpanded.add(orgName);
    }
    setExpandedOrgs(newExpanded);
  };

  const handleUserClick = (userId: string, orgId: string) => {
    setSelectedUserId(userId);
    setSelectedOrgId(orgId);
    setViewMode("detailed");
    setCurrentPage(1);
  };

  const formatBandwidth = (bandwidthKB: number) => {
    if (bandwidthKB >= 1024) {
      return `${(bandwidthKB / 1024).toFixed(2)} MB`;
    }
    return `${bandwidthKB.toFixed(2)} KB`;
  };

  const getHttpCodeColor = (code: number) => {
    if (code >= 500) return "text-red-600 font-bold";
    if (code >= 400) return "text-orange-600 font-semibold";
    if (code >= 300) return "text-blue-600";
    return "text-green-600";
  };

  const stats: LogsStats = logsStats?.getLogAnalytics || {
    overallStats: { totalErrors: 0, totalRequests: 0, totalBandwidth: 0 },
    orgSummary: [],
    userDetails: [],
  };

  const detailedLogs = detailedLogsData?.getDetailedLogs?.logs || [];
  const pagination = detailedLogsData?.getDetailedLogs?.pagination || {
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  };

  // Use filtered logs count for pagination display
  const displayPagination = {
    ...pagination,
    total: filteredLogs.length,
  };

  if (statsLoading && viewMode === "stats") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading logs...</div>
      </div>
    );
  }

  if (statsError && viewMode === "stats") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading logs: {JSON.stringify(statsError)}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">System Logs</h1>

        <div className="flex items-center gap-4 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "stats" ? "default" : "outline"}
              onClick={() => {
                setViewMode("stats");
                setSelectedUserId(null);
                setSelectedOrgId(null);
              }}
            >
              Statistics
            </Button>
            <Button
              variant={viewMode === "detailed" ? "default" : "outline"}
              onClick={() => {
                setViewMode("detailed");
                setCurrentPage(1);
              }}
            >
              Detailed Logs
            </Button>
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[280px] max-w-[400px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {format(startDate, "MMM dd")} {startTime} - {format(endDate, "MMM dd")} {endTime}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <Calendar
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    if (range?.from) setStartDate(range.from);
                    if (range?.to) setEndDate(range.to);
                  }}
                  numberOfMonths={2}
                />
                <div className="flex gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {viewMode === "stats" ? (
        <>
          {/* Overall Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.overallStats.totalErrors}</div>
                  <div className="text-sm text-muted-foreground">Total Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.overallStats.totalRequests.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatBandwidth(stats.overallStats.totalBandwidth)}</div>
                  <div className="text-sm text-muted-foreground">Total Bandwidth</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Total Errors</TableHead>
                    <TableHead className="text-right">Total Requests</TableHead>
                    <TableHead className="text-right">Bandwidth</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.orgSummary.map((org: any) => (
                    <>
                      <TableRow key={org.orgName} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{org.orgName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={org.totalErrors > 0 ? "destructive" : "secondary"}>{org.totalErrors}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{org.totalRequests.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatBandwidth(org.totalBandwidth)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleOrgExpansion(org.orgName)}>
                            {expandedOrgs.has(org.orgName) ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded User Details */}
                      {expandedOrgs.has(org.orgName) && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <h4 className="font-semibold mb-3">User Details for {org.orgName}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Errors</TableHead>
                                    <TableHead className="text-right">Requests</TableHead>
                                    <TableHead className="text-right">Bandwidth</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stats.userDetails
                                    .find((detail) => detail.orgName === org.orgName)
                                    ?.users.map((user: any) => (
                                      <TableRow key={user.userId}>
                                        <TableCell className="font-mono text-sm">{user.userName || user.userId}</TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant={user.totalErrors > 0 ? "destructive" : "secondary"}>
                                            {user.totalErrors}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{user.totalRequests.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{formatBandwidth(user.totalBandwidth)}</TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUserClick(user.userId, org.orgName)}
                                          >
                                            View Details
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search logs (URL, method, description, status code, user ID, org ID)..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full md:w-auto"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Method Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">Method</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {filters.method || "All Methods"}
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search method..." />
                              <CommandList>
                                <CommandEmpty>No method found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, method: undefined });
                                      setCurrentPage(1);
                                    }}
                                  >
                                    All Methods
                                  </CommandItem>
                                  {uniqueValues.methods.map((method: string) => (
                                    <CommandItem
                                      key={method}
                                      onSelect={() => {
                                        setFilters({ ...filters, method });
                                        setCurrentPage(1);
                                      }}
                                    >
                                      {method}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* HTTP Code Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">Status Code</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {filters.httpCode || "All Codes"}
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search status code..." />
                              <CommandList>
                                <CommandEmpty>No code found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, httpCode: undefined });
                                      setCurrentPage(1);
                                    }}
                                  >
                                    All Codes
                                  </CommandItem>
                                  {uniqueValues.httpCodes.map((code: string) => (
                                    <CommandItem
                                      key={code}
                                      onSelect={() => {
                                        setFilters({ ...filters, httpCode: code });
                                        setCurrentPage(1);
                                      }}
                                    >
                                      {code}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Org ID Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">Organization</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {filters.orgId || "All Orgs"}
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search org..." />
                              <CommandList>
                                <CommandEmpty>No org found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, orgId: undefined });
                                      setCurrentPage(1);
                                    }}
                                  >
                                    All Orgs
                                  </CommandItem>
                                  {uniqueValues.orgIds.map((orgId: string) => (
                                    <CommandItem
                                      key={orgId}
                                      onSelect={() => {
                                        setFilters({ ...filters, orgId });
                                        setCurrentPage(1);
                                      }}
                                    >
                                      {orgId}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* User ID Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">User</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {filters.userId ? (uniqueValues.userIdToNameMap?.get(filters.userId) || filters.userId) : "All Users"}
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search user..." />
                              <CommandList>
                                <CommandEmpty>No user found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, userId: undefined });
                                      setCurrentPage(1);
                                    }}
                                  >
                                    All Users
                                  </CommandItem>
                                  {uniqueValues.userIds.map((userId: string) => {
                                    const userName = uniqueValues.userIdToNameMap?.get(userId) || userId;
                                    return (
                                      <CommandItem
                                        key={userId}
                                        onSelect={() => {
                                          setFilters({ ...filters, userId });
                                          setCurrentPage(1);
                                        }}
                                      >
                                        {userName}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* URL Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">URL</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {filters.url || "All URLs"}
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search URL..." />
                              <CommandList>
                                <CommandEmpty>No URL found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, url: undefined });
                                      setCurrentPage(1);
                                    }}
                                  >
                                    All URLs
                                  </CommandItem>
                                  {uniqueValues.urls.slice(0, 50).map((url: string) => (
                                    <CommandItem
                                      key={url}
                                      onSelect={() => {
                                        setFilters({ ...filters, url });
                                        setCurrentPage(1);
                                      }}
                                    >
                                      <span className="truncate">{url}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {(filters.method || filters.httpCode || filters.orgId || filters.userId || filters.url) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setFilters({});
                          setCurrentPage(1);
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Card>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="errors-only"
                    checked={errorsOnly}
                    onCheckedChange={(checked) => {
                      setErrorsOnly(checked as boolean);
                      setCurrentPage(1);
                    }}
                  />
                  <Label htmlFor="errors-only" className="cursor-pointer">
                    Errors Only
                  </Label>
                </div>
                {selectedOrgId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrgId(null);
                      setSelectedUserId(null);
                      setCurrentPage(1);
                    }}
                  >
                    Clear Org Filter
                  </Button>
                )}
                {selectedUserId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUserId(null);
                      setCurrentPage(1);
                    }}
                  >
                    Clear User Filter
                  </Button>
                )}
              </div>

              {selectedUserId && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm">
                    <span className="font-semibold">Filtered by User:</span> {selectedUserId}
                    {selectedOrgId && <span className="ml-2">in {selectedOrgId}</span>}
                  </p>
                </div>
              )}

              {/* Detailed Logs Table */}
              {detailedLogsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading detailed logs...</div>
                </div>
              ) : detailedLogsError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-red-600">Error loading detailed logs</div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-auto h-[600px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                            <TableHead className="whitespace-nowrap">Method</TableHead>
                            <TableHead className="whitespace-nowrap min-w-[200px]">URL</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">User</TableHead>
                            <TableHead className="whitespace-nowrap">Org ID</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Time (ms)</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Bandwidth</TableHead>
                            <TableHead className="whitespace-nowrap min-w-[150px]">Description</TableHead>
                            <TableHead className="whitespace-nowrap w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                No logs found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredLogs.flatMap((log: LogEntry, index: number) => {
                              const logId = `${log.timestamp}-${index}`;
                              const isExpanded = expandedLogs.has(logId);
                              const rows = [
                                <TableRow
                                  key={`${log.timestamp}-${index}`}
                                  className={cn(
                                    "hover:bg-muted/50",
                                    log.isError && "bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500"
                                  )}
                                >
                                  <TableCell className="font-mono text-xs whitespace-nowrap">
                                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Badge variant="outline">{log.method}</Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[300px] truncate" title={log.url}>
                                    {log.url}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <span className={getHttpCodeColor(log.httpCode)}>{log.httpCode}</span>
                                    {log.isError && <AlertCircle className="inline ml-1 h-4 w-4 text-red-600" />}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Button
                                      variant="link"
                                      className="h-auto p-0 font-mono text-xs"
                                      onClick={() => handleUserClick(log.userId, log.orgId)}
                                      title={log.userId}
                                    >
                                      {log.userName || log.userId}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs whitespace-nowrap">{log.orgId}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">{log.elapsedTimeMs.toFixed(2)}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">{formatBandwidth(log.bandwidthKB)}</TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={log.description}>
                                    {log.description || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {log.isError && log.payload && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleLogExpansion(logId)}
                                        className="h-8 w-8 p-0"
                                      >
                                        {isExpanded ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ];
                              
                              if (isExpanded && log.isError && log.payload) {
                                rows.push(
                                  <TableRow key={`${logId}-payload`}>
                                    <TableCell colSpan={10} className="bg-muted/30 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-semibold text-sm">Payload (Error Request)</h4>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleLogExpansion(logId)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                            {log.payload}
                                          </pre>
                                        </ScrollArea>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                              
                              return rows;
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * logsPerPage + 1).toLocaleString()} to{" "}
                      {Math.min(currentPage * logsPerPage, filteredLogs.length).toLocaleString()} of{" "}
                      {filteredLogs.length.toLocaleString()} logs
                      {filteredLogs.length !== detailedLogs.length && (
                        <span className="ml-2 text-xs">
                          (filtered from {detailedLogs.length.toLocaleString()} total)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage >= pagination.totalPages}
                      >
                        Next
                      </Button>
                      <Select
                        value={logsPerPage.toString()}
                        onValueChange={(value) => {
                          setLogsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Log Detail Modal */}
      <Dialog open={selectedUserId !== null && viewMode === "stats"} onOpenChange={() => setSelectedUserId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>User Log Details</DialogTitle>
            <DialogDescription>
              Detailed logs for user: <span className="font-mono">{selectedUserId}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("detailed");
                setCurrentPage(1);
              }}
            >
              View in Detailed Logs View
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
