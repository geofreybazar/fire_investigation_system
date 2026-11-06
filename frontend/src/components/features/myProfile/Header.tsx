import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { User } from "@/interface/users/users";

const Header = ({ user }: { user: User }) => {
  const initials = `${user.first_name[0]}${user.last_name[0]}`;

  const fullName = [
    user.first_name,
    user.middle_name ? `${user.middle_name[0]}` : "",
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const role = user.role
    .split("_")
    .map((word) => word.toLowerCase())
    .join(" ");

  return (
    <Card>
      <CardContent className='space-y-5 p-4 sm:p-5'>
        {/* Profile */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          {/* Avatar */}
          <div className='flex size-16 shrink-0 items-center justify-center self-start rounded-full bg-muted text-lg font-semibold uppercase'>
            {initials}
          </div>

          {/* User information */}
          <div className='min-w-0 flex-1'>
            <h2 className='break-words text-lg font-semibold sm:truncate'>
              {user.rank} {fullName}
            </h2>

            <p className='break-words text-sm text-muted-foreground sm:truncate'>
              {user.office.name}
            </p>

            <Badge variant='secondary' className='mt-2 text-xs capitalize'>
              {role}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
