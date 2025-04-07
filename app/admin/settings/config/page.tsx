"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "graphql-hooks";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function TablePageSizeConfigPage() {
  const [TablePageConfig] = useMutation(companyMutation.UPDATE_COMPANY_TABLE_PAGE_CONFIG);
  const { toast } = useToast()


  const [formData, setFormData] = useState({
    pageSize: "10",
  });

  const handleSubmit = async () => {

    try {
      const { data, error } = await TablePageConfig({
        variables: {
          pageSize: formData.pageSize,
        },
      });

      if (error) {
        const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ");
        toast({
          title: 'Error',
          description: message || "Something went wrong",
          variant: "destructive"
        });
        return;
      }

      toast({
        variant: "default",
        title: "Page Size Form Updated Successfully!",
      });

    } catch (error) {
      console.log(error);
    }

  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="p-8 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Page Size Configuration</h2>
            <Button size={'sm'} onClick={handleSubmit}>Save</Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-gray-700 font-medium">Page size</Label>
                <span className="text-gray-400 text-sm">@default: 10</span>
              </div>
              <Input
                value={formData.pageSize}
                type="number"
                min={1}
                max={100}
                maxLength={3}
                placeholder="Page Size"
                onChange={(e) => setFormData({ ...formData, pageSize: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}