import { Badge } from "@/components/ui/badge";
import type { User } from "@/interface/users/users";

import { User2 } from "lucide-react";

const Header = ({ selectedPersonnel }: { selectedPersonnel: User }) => {
  const fullName = [
    selectedPersonnel.rank,
    selectedPersonnel.first_name,
    selectedPersonnel.middle_name,
    selectedPersonnel.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className='flex items-start gap-4'>
      <div className='flex size-12 shrink-0 items-center justify-center rounded-full border bg-muted'>
        <User2 className='size-6 text-muted-foreground' />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-lg font-semibold tracking-tight'>{fullName}</h2>

          <Badge variant={selectedPersonnel.isActive ? "default" : "secondary"}>
            {selectedPersonnel.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <p className='mt-1 text-sm text-muted-foreground'>Personnel Account</p>
      </div>
    </div>
  );
};

export default Header;
