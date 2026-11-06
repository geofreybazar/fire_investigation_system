import ProfileItem from "./ProfileItem";
import { Building2, Shield, Hash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { User } from "@/interface/users/users";

const AccountInformation = ({ user }: { user: User }) => {
  const role = user.role
    .split("_")
    .map((word) => word.toLowerCase())
    .join(" ");

  const officeType = user.office.type
    .split("_")
    .map((word) => word.toLowerCase())
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>
          Your FIIS account and organizational details.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-5'>
        <ProfileItem
          icon={Hash}
          label='Account Number'
          value={user.account_number}
        />

        <Separator />

        <ProfileItem icon={Shield} label='Role' value={role} capitalize />

        <Separator />

        <ProfileItem icon={Building2} label='Office' value={user.office.name} />

        <Separator />

        <ProfileItem
          icon={Building2}
          label='Office Type'
          value={officeType}
          capitalize
        />
      </CardContent>
    </Card>
  );
};

export default AccountInformation;
