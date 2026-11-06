import ChangePassword from "./ChangePassword";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Shield } from "lucide-react";

const Security = () => {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <div className='rounded-md bg-muted p-2'>
            <Shield className='size-4 text-muted-foreground' />
          </div>

          <div>
            <CardTitle className='text-base'>Security</CardTitle>

            <CardDescription>Manage your account security.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <Lock className='mt-0.5 size-4 text-muted-foreground' />

            <div>
              <p className='text-sm font-medium'>Change Password</p>

              <p className='text-sm text-muted-foreground'>
                Update your account password.
              </p>
            </div>
          </div>

          {/* Change Password component */}
          <ChangePassword />
        </div>
      </CardContent>
    </Card>
  );
};

export default Security;
