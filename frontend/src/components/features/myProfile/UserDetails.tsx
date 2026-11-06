import { useUserStore } from "@/store/userStore";
import useGetUser from "@/hooks/users/useGetUser";
import { Navigate } from "react-router";

import Header from "./Header";
import PersonalInformation from "./PersonalInformation";
import AccountInformation from "./AccountInformation";

const UserDetails = () => {
  const user = useUserStore((u) => u.user);

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const { user: fetchedUser } = useGetUser(user.id);

  return (
    <>
      {/* Profile Header */}
      <Header user={fetchedUser} />

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Personal Information */}
        <PersonalInformation user={fetchedUser} />

        {/* Account Information */}
        <AccountInformation user={fetchedUser} />
      </div>
    </>
  );
};

export default UserDetails;
