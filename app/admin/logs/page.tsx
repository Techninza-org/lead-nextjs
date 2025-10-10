"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "graphql-hooks";
import { adminQueries } from "@/lib/graphql/admin/queries";

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
      totalErrors: number;
      totalRequests: number;
      totalBandwidth: number;
    }>;
  }>;
}

interface UserLogStats {
  userId: string;
  totalErrors: number;
  totalRequests: number;
  totalBandwidth: number;
}

export default function LogsPage() {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  // Test query to see if GraphQL is working
  const { data: testData } = useQuery(`
    query TestAnalytics {
      testAnalytics
    }
  `, {
    onSuccess: ({ data }) => {
    },
    onError: (error: any) => {
      console.error('Frontend: Test analytics query error:', error);
    }
  });

  // Query for logs statistics
  const { data: logsStats, loading: statsLoading, error: statsError } = useQuery(adminQueries.GET_LOGS_STATS, {
    variables: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    onSuccess: ({ data }) => {
    },
    onError: (error: any) => {
      console.error('Frontend: GraphQL error:', error);
    }
  });



  const toggleOrgExpansion = (orgName: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgName)) {
      newExpanded.delete(orgName);
    } else {
      newExpanded.add(orgName);
    }
    setExpandedOrgs(newExpanded);
  };

  const formatBandwidth = (bandwidthKB: number) => {
    if (bandwidthKB >= 1024) {
      return `${(bandwidthKB / 1024).toFixed(2)} MB`;
    }
    return `${bandwidthKB.toFixed(2)} KB`;
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading logs...</div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading logs: {JSON.stringify(statsError)}
        </div>
      </div>
    );
  }

  const stats: LogsStats = logsStats?.getLogAnalytics || {
    overallStats: { totalErrors: 0, totalRequests: 0, totalBandwidth: 0 },
    orgSummary: [],
    userDetails: [],
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Logs</h1>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>Date Range:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "PPP")} - {format(endDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    if (range?.from) setStartDate(range.from);
                    if (range?.to) setEndDate(range.to);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

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
                      <Badge variant={org.totalErrors > 0 ? "destructive" : "secondary"}>
                        {org.totalErrors}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{org.totalRequests.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatBandwidth(org.totalBandwidth)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrgExpansion(org.orgName)}
                      >
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
                                <TableHead>User ID</TableHead>
                                <TableHead className="text-right">Errors</TableHead>
                                <TableHead className="text-right">Requests</TableHead>
                                <TableHead className="text-right">Bandwidth</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.userDetails
                                .find(detail => detail.orgName === org.orgName)
                                ?.users.map((user: any) => (
                                  <TableRow key={user.userId}>
                                    <TableCell className="font-mono text-sm">{user.userId}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={user.totalErrors > 0 ? "destructive" : "secondary"}>
                                        {user.totalErrors}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{user.totalRequests.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{formatBandwidth(user.totalBandwidth)}</TableCell>
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
    </div>
  );
}

