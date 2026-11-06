import { Navigate } from "react-router";
import { useUserStore } from "@/store/userStore";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import SettingSwitch from "../SettingSwitch";
import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useGetUserNotificationSettings from "@/hooks/notifications/useGetUserNotificationSettings";
import useUpdateNotificationSettings from "@/hooks/notifications/useUpdateNotificationSettings";
import {
  notificationSchema,
  type NotificationInput,
} from "@/interface/notifications/notifications";

// Hooks can't run after an early return, so the form is its own component.
const NotificationSettingsForm = ({ userId }: { userId: string }) => {
  const { notificationSettings } = useGetUserNotificationSettings(userId);

  const methods = useForm<NotificationInput>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      investigationUpdates: notificationSettings.investigationUpdates,
      reportReview: notificationSettings.reportReview,
      systemAnnouncements: notificationSettings.systemAnnouncements,
    },
  });

  const { updateSettings, isPending } = useUpdateNotificationSettings();

  const onSubmit = async (data: NotificationInput) => {
    await updateSettings({
      userId,
      investigationUpdates: data.investigationUpdates,
      reportReview: data.reportReview,
      systemAnnouncements: data.systemAnnouncements,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <div className='rounded-md bg-muted p-2'>
            <Bell className='size-4 text-muted-foreground' />
          </div>

          <div>
            <CardTitle className='text-base'>Notifications</CardTitle>

            <CardDescription>
              Choose which notifications you want to receive.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <CardContent className='space-y-5'>
          <Controller
            name='investigationUpdates'
            control={methods.control}
            render={({ field }) => (
              <SettingSwitch
                id='investigation-updates'
                label='Investigation Updates'
                description='Receive notifications when a case is referred to your office or an investigation is assigned to you.'
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  methods.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              />
            )}
          />

          <Separator />

          <Controller
            name='reportReview'
            control={methods.control}
            render={({ field }) => (
              <SettingSwitch
                id='report-review'
                label='Report Review'
                description='Receive notifications when a report needs your review, or your report is approved or rejected.'
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  methods.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              />
            )}
          />

          <Separator />

          <Controller
            name='systemAnnouncements'
            control={methods.control}
            render={({ field }) => (
              <SettingSwitch
                id='system-announcements'
                label='System Announcements'
                description='Receive important FIIS system announcements.'
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  methods.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              />
            )}
          />
        </CardContent>
      </form>
    </Card>
  );
};

const Notifications = () => {
  const user = useUserStore((u) => u.user);

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return <NotificationSettingsForm userId={user.id} />;
};

export default Notifications;
