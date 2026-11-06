import loadable from "@loadable/component";
import { ErrorBoundary } from "react-error-boundary";
import { Settings as SettingsIcon } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

import Apperance from "@/components/features/settings/Apperance";
import NotificationLoading from "@/components/features/settings/notificationSettings/NotificationLoading";
import Security from "@/components/features/settings/security/Security";
import NotificationSettingsError from "@/components/features/settings/notificationSettings/NotificationSettingsError";

const Notifications = loadable(
  () =>
    import("@/components/features/settings/notificationSettings/Notifications"),
  {
    fallback: <NotificationLoading />,
  },
);

const Settings = () => {
  return (
    <div className='mx-auto w-full max-w-3xl space-y-6'>
      {/* Header */}
      <PageHeader
        icon={<SettingsIcon />}
        title='Settings'
        description='Manage your FIIS preferences and account settings.'
      />

      {/* Appearance */}
      <Apperance />

      {/* Notification */}
      <ErrorBoundary FallbackComponent={NotificationSettingsError}>
        <Notifications />
      </ErrorBoundary>

      {/* Security */}
      <Security />
    </div>
  );
};

export default Settings;
