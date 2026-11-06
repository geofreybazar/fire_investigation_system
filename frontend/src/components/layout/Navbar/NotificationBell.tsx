import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { cn } from "cn";
import {
  useGetInbox,
  useGetUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/notifications/useNotificationInbox";
import type { AppNotification } from "@/interface/notifications/notifications";
import { formatDateTime } from "@/utils/dateTime";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const linkFor = (notification: AppNotification) =>
  notification.entityType === "INVESTIGATION"
    ? `/investigations/${notification.entityId}`
    : `/cases/${notification.entityId}`;

// In-app notifications (REQUIREMENTS.md Q-21): the latest ten, newest first.
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { unread } = useGetUnreadCount();
  const { inbox, isLoading, isError } = useGetInbox(1, open);
  const { markRead } = useMarkNotificationRead();
  const { markAllRead, isPending } = useMarkAllNotificationsRead();

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) {
      // Navigation shouldn't wait on, or fail because of, the read receipt.
      markRead(notification.id).catch(() => {});
    }
    setOpen(false);
    navigate(linkFor(notification));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='relative'
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
          >
            <Bell className='size-5' />
            {unread > 0 && (
              <span className='absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white'>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align='end' className='w-80 p-0 sm:w-96'>
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <p className='font-semibold'>Notifications</p>
          <Button
            variant='ghost'
            size='sm'
            disabled={unread === 0 || isPending}
            onClick={() => markAllRead().catch(() => {})}
          >
            Mark all read
          </Button>
        </div>

        <div className='max-h-96 overflow-y-auto'>
          {isLoading ? (
            <div className='flex justify-center p-6'>
              <Spinner />
            </div>
          ) : isError ? (
            <p className='p-6 text-center text-sm text-muted-foreground'>
              Notifications could not be loaded.
            </p>
          ) : !inbox || inbox.data.length === 0 ? (
            <p className='p-6 text-center text-sm text-muted-foreground'>
              You have no notifications.
            </p>
          ) : (
            <ul className='divide-y'>
              {inbox.data.map((notification) => (
                <li key={notification.id}>
                  <button
                    type='button'
                    onClick={() => openNotification(notification)}
                    className='flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/50'
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        notification.readAt ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className='min-w-0 space-y-0.5'>
                      <span
                        className={cn(
                          "block text-sm",
                          !notification.readAt && "font-semibold",
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className='block text-sm text-muted-foreground'>
                        {notification.body}
                      </span>
                      <span className='block text-xs text-muted-foreground'>
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
