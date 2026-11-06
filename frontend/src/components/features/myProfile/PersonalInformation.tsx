import { Mail, UserRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import ProfileItem from "./ProfileItem";
import type { User } from "@/interface/users/users";

const PersonalInformation = ({ user }: { user: User }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your basic personal information.</CardDescription>
      </CardHeader>

      <CardContent className='space-y-5'>
        <ProfileItem
          icon={UserRound}
          label='First Name'
          value={user.first_name}
        />

        <Separator />

        <ProfileItem
          icon={UserRound}
          label='Middle Name'
          value={user.middle_name || "—"}
        />

        <Separator />

        <ProfileItem
          icon={UserRound}
          label='Last Name'
          value={user.last_name}
        />

        <Separator />

        <ProfileItem icon={Mail} label='Email' value={user.email} />
      </CardContent>
    </Card>
  );
};

export default PersonalInformation;
