import { CompaniesListTable } from "@/components/User/Admin/companies-list-table";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function LeadsPage() {

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <CompaniesListTable />
        </CardContent>
      </Card>
    );
  }
  