import SectionHeader from "./SectionHeader";
import InfoItem from "./InfoItem";
import { formatRole } from "@/utils/formatRole";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

import type { User } from "@/interface/users/users";

const SystemAccess = ({ user }: { user: User }) => {
  return (
    <section>
      <SectionHeader
        icon={<ShieldCheck className='size-4' />}
        title='System Access'
      />

      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <InfoItem label='Role' value={formatRole(user.role)} />

        <div className='space-y-1.5'>
          <p className='text-xs font-medium text-muted-foreground'>
            Account Status
          </p>

          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </section>
  );
};

export default SystemAccess;
