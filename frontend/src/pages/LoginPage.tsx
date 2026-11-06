import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import logo from "@/assets/logo.svg";
import LoginForm from "@/components/features/login/LoginForm";

const LoginPage = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8'>
      <Card className='w-full max-w-md rounded-2xl border-t-4 border-t-primary shadow-md'>
        <CardHeader className='space-y-2 text-center'>
          <div className='mb-2 flex justify-center'>
            <img
              src={logo}
              alt='Bureau of Fire Protection logo'
              className='w-48 sm:w-60'
            />
          </div>
          <CardTitle className='text-xl tracking-wide'>
            Fire Investigation and Suppression System
          </CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm />
          <p className='mt-4 text-center text-xs text-muted-foreground'>
            © {new Date().getFullYear()} Bureau of Fire Protection. All rights
            reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
