import { formatOfficeType } from "@/utils/formatOfficeType";
import InfoItem from "./InfoItem";
import type { User } from "@/interface/users/users";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import SectionHeader from "./SectionHeader";

const Assignment = ({ user }: { user: User }) => {
  console.log(user);
  return (
    <section>
      <SectionHeader
        icon={<Building2 className='size-4' />}
        title='Assignment'
      />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <InfoItem
          label='Office'
          value={user.office?.name || "—"}
          icon={<Building2 className='size-4' />}
        />

        <InfoItem
          label='Office Type'
          value={user.office?.type ? formatOfficeType(user.office.type) : "—"}
        />

        <InfoItem
          label='Position'
          value={user.position?.name || "—"}
          icon={<BriefcaseBusiness className='size-4' />}
        />
      </div>
    </section>
  );
};

export default Assignment;
