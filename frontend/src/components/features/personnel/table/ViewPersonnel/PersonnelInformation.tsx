import { Mail, User2 } from "lucide-react";
import InfoItem from "./InfoItem";
import type { User } from "@/interface/users/users";
import SectionHeader from "./SectionHeader";

const PersonnelInformation = ({ user }: { user: User }) => {
  return (
    <section>
      <SectionHeader
        icon={<User2 className='size-4' />}
        title='Personal Information'
      />
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <InfoItem label='Account Number' value={user.account_number} />

        <InfoItem
          label='Email'
          value={user.email}
          icon={<Mail className='size-4' />}
        />

        <InfoItem label='First Name' value={user.first_name} />

        <InfoItem label='Middle Name' value={user.middle_name || "—"} />

        <InfoItem label='Last Name' value={user.last_name} />

        <InfoItem label='Rank' value={user.rank} />
      </div>
    </section>
  );
};

export default PersonnelInformation;
