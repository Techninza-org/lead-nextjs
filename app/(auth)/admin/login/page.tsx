import { AdminLoginForm } from "@/components/User/Admin/auth/admin-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link";


export default function LoginPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="bg-inherit ">
        <CardHeader>
          <CardTitle className="font-bold">Login</CardTitle>
          <CardDescription>Welcome Back!</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-gray-700">
            Dont have an account?
            <Link href="/signup">
              <span className="text-blue-600"> Sign up</span>
            </Link>
          </p>
        </CardFooter>
      </Card>
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full mx-auto" type="button">
        <Mail className="mr-2" />
        <span>Continue with Email</span>
      </Button> */}
    </div>
  );
}
