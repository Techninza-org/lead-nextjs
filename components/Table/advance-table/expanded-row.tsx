import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "lucide-react"

interface ExpandedRowContentProps {
  row: any
  dependentCols: string[]
}

export const ExpandedRowContent = ({ row, dependentCols }: ExpandedRowContentProps) => {
  const dependentValue = row.original.dependentValue

  return (
    <Card className="w-full max-w-3xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-700">Additional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {[...dependentCols, "Created At"].map((col) => (
                <TableHead key={col} className="text-center">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {dependentCols.map((col) => (
                <TableCell key={col} className="text-center">
                  {dependentValue[col]}
                </TableCell>
              ))}
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(dependentValue.createdAt).toLocaleString()}</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}