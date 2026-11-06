import { SidebarTrigger } from "@/components/ui/sidebar";
import ModeToggle from "../ModeToggle/ModeToggle";
import CurrentDateTime from "./CurrentDateTime";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  return (
    <div className='sticky top-0 z-50 flex w-full items-center justify-between gap-2 border-b bg-sidebar p-2'>
      <SidebarTrigger />
      <CurrentDateTime />
      <div className='flex items-center gap-1'>
        <NotificationBell />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Navbar;
