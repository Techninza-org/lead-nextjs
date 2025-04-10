"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "graphql-hooks";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/components/providers/CompanyProvider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const GET_PAGE_SIZE_BY_COMPANY_ID = `
  query GetPageSizeByCompanyId($id: ID!) {
    getPageSizeByCompanyId(id: $id)
  }
`;

export default function TablePageSizeConfigPage() {
  const [TablePageConfig] = useMutation(companyMutation.UPDATE_COMPANY_TABLE_PAGE_CONFIG);
  const { toast } = useToast();
  const [openSource, setOpenSource] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  const { rootInfo } = useCompany();

  const roots = useMemo(
    () =>
      rootInfo?.map((root: any) => ({
        value: root.id,
        label: root.name,
      })) || [],
    [rootInfo]
  );

  const [formData, setFormData] = useState({
    pageSize: "10",
  });

  // Fetch page size when company is selected
  const { loading, error, data } = useQuery(GET_PAGE_SIZE_BY_COMPANY_ID, {
    variables: { id: sourceValue },
    skip: !sourceValue, // Only run query if sourceValue is set
  });

  // Update formData.pageSize when data is fetched
  useEffect(() => {
    if (data?.getPageSizeByCompanyId) {
      setFormData((prev) => ({
        ...prev,
        pageSize: String(data?.getPageSizeByCompanyId),
      }));
    }
  }, [data]);

  const handleSubmit = async () => {
    try {
      const { data, error } = await TablePageConfig({
        variables: {
          id: sourceValue,
          pageSize: parseInt(formData.pageSize, 10),
        },
      });

      if (error) {
        const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
        toast({
          title: "Error",
          description: message || "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      toast({
        variant: "default",
        title: "Page Size Form Updated Successfully!",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="p-8 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Page Size Configuration</h2>
            <Button size={"sm"} onClick={handleSubmit} disabled={!sourceValue || loading}>
              Save
            </Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-gray-700 font-medium">Page size</Label>
                <span className="text-gray-400 text-sm">@default: 10</span>
              </div>
              <Popover open={openSource} onOpenChange={setOpenSource}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSource}
                    className="w-[200px] justify-between"
                  >
                    {sourceValue
                      ? roots.find((root) => root.value === sourceValue)?.label
                      : "Select Company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Company..." />
                    <CommandList>
                      <CommandEmpty>No Company found.</CommandEmpty>
                      <CommandGroup>
                        {roots.map((root) => (
                          <CommandItem
                            key={root.value}
                            value={root.value}
                            onSelect={(currentValue) => {
                              setSourceValue(currentValue === sourceValue ? "" : currentValue);
                              setOpenSource(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                sourceValue === root.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {root.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                value={formData.pageSize}
                type="number"
                min={1}
                max={100}
                maxLength={3}
                placeholder="Page Size"
                onChange={(e) => setFormData({ ...formData, pageSize: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || !sourceValue}
              />
              {error && (
                <p className="text-red-500 text-sm">Failed to load page size</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}