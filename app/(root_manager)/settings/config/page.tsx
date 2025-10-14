"use client"

import { useCallback, useEffect, useState } from "react"
import { useMutation } from "graphql-hooks"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { companyMutation } from "@/lib/graphql/company/mutation"

interface TableConfigPageProps {
  isApiHit: boolean
  tableName: string
}

const TableConfigPage = ({ isApiHit, tableName }: TableConfigPageProps) => {
  const [TableConfig] = useMutation(companyMutation.UPDATE_COMPANY_TABLE_CONFIG)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    prefix: "pre",
    suffix: "suff",
    number: "5",
    separator: "-",
  })

  const [enabledFields, setEnabledFields] = useState({
    prefix: true,
    suffix: true,
    separator: true,
  })

  const getPadding = () => "0".repeat(Number.parseInt(formData.number, 10) || 0)

  const generateSample = () => {
    const parts = []
    if (enabledFields.prefix) parts.push(formData.prefix)
    parts.push("00100")
    if (enabledFields.suffix) parts.push(formData.suffix)
    return parts.join(enabledFields.separator ? formData.separator : "")
  }

  const generateOp1 = () => {
    const parts = []
    parts.push("pre")
    parts.push(getPadding())
    parts.push("suff")
    return parts.join(enabledFields.separator ? formData.separator : "")
  }

  const handleSubmit = useCallback(async () => {
    try {
      const { data, error } = await TableConfig({
        variables: {
          tablename: tableName,
          pre: enabledFields.prefix ? formData.prefix : null,
          suf: enabledFields.suffix ? formData.suffix : null,
          pad: formData.number,
          separator: enabledFields.separator ? formData.separator : null,
          enabledPrefix: enabledFields.prefix,
          enabledSuffix: enabledFields.suffix,
          enabledSeparator: enabledFields.separator,
          enabledNumber: true,
        },
      })

      if (error) {
        const message = error?.graphQLErrors?.map((e: any) => e.message).join(", ")
        toast({
          title: "Error",
          description: message || "Something went wrong",
          variant: "destructive",
        })
        return
      }

      toast({
        variant: "default",
        title: "Table Configuration Updated Successfully!",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to update table configuration",
        variant: "destructive",
      })
    }
  }, [TableConfig, tableName, enabledFields, formData, toast])


  // Only call handleSubmit when isApiHit changes to true
  useEffect(() => {
    if (isApiHit) {
      handleSubmit()
    }
  }, [isApiHit, handleSubmit])

  return (
    <div className="bg-gray-50">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-8 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Configuration</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={enabledFields.prefix}
                  onCheckedChange={(checked) =>
                    setEnabledFields((prev) => ({
                      ...prev,
                      prefix: checked === true,
                    }))
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
                    setEnabledFields((prev) => ({
                      ...prev,
                      suffix: checked === true,
                    }))
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
                    setEnabledFields((prev) => ({
                      ...prev,
                      separator: checked === true,
                    }))
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
              <div className="text-blue-600 text-lg font-mono bg-gray-50 p-3 rounded-md">{generateSample()}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Operations</Label>
              <div className="text-blue-600 font-mono bg-gray-50 p-3 rounded-md space-y-2">
                <div>{generateOp1()}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TableConfigPage
