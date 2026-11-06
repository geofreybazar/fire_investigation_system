import { Separator } from "@/components/ui/separator";
import Assignment from "./Assignment";
import SystemAccess from "./SystemAccess";
import PersonnelNotFound from "../PersonnelNotFound";
import PersonnelInformation from "./PersonnelInformation";
import Header from "./Header";

import type { User } from "@/interface/users/users";

interface ViewPersonnelProps {
  selectedPersonnel: User | undefined;
}

const ViewPersonnel = ({ selectedPersonnel }: ViewPersonnelProps) => {
  if (!selectedPersonnel) {
    return <PersonnelNotFound />;
  }
  console.log(selectedPersonnel);
  return (
    <div className='flex flex-col'>
      {/* Header */}
      <Header selectedPersonnel={selectedPersonnel} />

      <Separator className='my-6' />

      {/* Content */}
      <div className='space-y-6 overflow-y-auto pr-1'>
        <div className='flex flex-col md:flex-row gap-5 '>
          {/* Personal Information */}
          <div className='md:w-1/2'>
            <PersonnelInformation user={selectedPersonnel} />
          </div>

          {/* Assignment */}
          <div className='md:w-1/2'>
            <Assignment user={selectedPersonnel} />
          </div>
        </div>

        <Separator />

        {/* System Access */}
        <SystemAccess user={selectedPersonnel} />
      </div>
    </div>
  );
};

export default ViewPersonnel;
