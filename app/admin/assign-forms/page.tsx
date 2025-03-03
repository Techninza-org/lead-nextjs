import { AssignFormToRoot } from "@/components/admin/AssignFormToRoot";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@/components/ui/card"

export default function AssignForm() {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="font-bold">Assign Form</CardTitle>
         </CardHeader>
         <CardContent>
            <AssignFormToRoot />
         </CardContent>
      </Card>
   );
}
