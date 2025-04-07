"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useMutation } from "graphql-hooks";
import { companyMutation } from "@/lib/graphql/company/mutation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function TableConfigPage() {
  const [TableConfig] = useMutation(companyMutation.UPDATE_COMPANY_TABLE_CONFIG);
  const { toast } = useToast()


  const [formData, setFormData] = useState({
    prefix: "pre",
    suffix: "suff",
    number: "5",
    separator: "-",
  });

  const [enabledFields, setEnabledFields] = useState({
    prefix: true,
    suffix: true,
    separator: true
  });

  const getPadding = () => "0".repeat(parseInt(formData.number, 10) || 0);

  const generateSample = () => {
    const parts = [];
    if (enabledFields.prefix) parts.push(formData.prefix);
    parts.push("00100");
    if (enabledFields.suffix) parts.push(formData.suffix);
    return parts.join(enabledFields.separator ? formData.separator : "");
  };

  const generateOp1 = () => {
    const parts = [];
    parts.push("pre");
    parts.push(getPadding());
    parts.push("suff");
    return parts.join(enabledFields.separator ? formData.separator : "");
  };

  const generateOp2 = () => {
    const parts = [];
    parts.push(getPadding());
    parts.push("suff");
    return parts.join(enabledFields.separator ? formData.separator : "");
  };


  const handleSubmit = async () => {

    try {
      const { data, error } = await TableConfig({
        variables: {
          pre: enabledFields.prefix ? formData.prefix : null,
          suf: enabledFields.suffix ? formData.suffix : null,
          pad: formData.number,
          separator: enabledFields.separator ? formData.separator : null,

          enabledPrefix: enabledFields.prefix,
          enabledSuffix: enabledFields.suffix,
          enabledSeparator: enabledFields.separator,
          enabledNumber: true,

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
        title: "Department Form Updated Successfully!",
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
            <h2 className="text-2xl font-semibold text-gray-900">Configuration</h2>
            <Button size={'sm'} onClick={handleSubmit}>Save</Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={enabledFields.prefix}
                  onCheckedChange={(checked) =>
                    setEnabledFields(prev => ({ ...prev, prefix: checked === true }))
                  }
                  className="w-5 h-5"
                />
                <Label className="text-gray-700 font-medium">pre: {formData.prefix}</Label>
                <span className="text-gray-400 text-sm">@default: pre</span>
              </div>
              <Input
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={enabledFields.suffix}
                  onCheckedChange={(checked) =>
                    setEnabledFields(prev => ({ ...prev, suffix: checked === true }))
                  }
                  className="w-5 h-5"
                />
                <Label className="text-gray-700 font-medium">suffix: {formData.suffix}</Label>
                <span className="text-gray-400 text-sm">@default: suff</span>
              </div>
              <Input
                value={formData.suffix}
                onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-gray-700 font-medium">number: {formData.number}</Label>
                <span className="text-gray-400 text-sm">@default: 4</span>
              </div>
              <Input
                type="number"
                min="1"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={enabledFields.separator}
                  onCheckedChange={(checked) =>
                    setEnabledFields(prev => ({ ...prev, separator: checked === true }))
                  }
                  className="w-5 h-5"
                />
                <Label className="text-gray-700 font-medium">Separator: {formData.separator}</Label>
                <span className="text-gray-400 text-sm">@default: -</span>
              </div>
              <Input
                value={formData.separator}
                onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
                className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-white shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Preview</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Sample</Label>
              <div className="text-blue-600 text-lg font-mono bg-gray-50 p-3 rounded-md">
                {generateSample()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Operations</Label>
              <div className="text-blue-600 font-mono bg-gray-50 p-3 rounded-md space-y-2">
                <div>{generateOp1()}</div>
                <div>{generateOp2()}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}