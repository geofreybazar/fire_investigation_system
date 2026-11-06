import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import AlertInformation from "../components/features/myProfile/AlertInformation";
import PageHeader from "@/components/common/PageHeader";
import UserDetailsLoading from "@/components/features/myProfile/UserDetailsLoading";
import loadable from "@loadable/component";
import { UserRound } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

const UserDetails = loadable(
  () => import("@/components/features/myProfile/UserDetails"),
  {
    fallback: <UserDetailsLoading />,
  },
);

const MyProfile = () => {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <PageHeader
        icon={<UserRound />}
        title='My Profile'
        description='View your account and organizational information.'
      />

      {/* Information alert */}
      <AlertInformation />

      {/* User details */}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <UserDetails />
      </ErrorBoundary>
    </div>
  );
};

export default MyProfile;
