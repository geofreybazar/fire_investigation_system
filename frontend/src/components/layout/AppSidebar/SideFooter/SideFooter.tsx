import { Navigate } from "react-router";
import useGetUser from "@/hooks/users/useGetUser";
import { useUserStore } from "@/store/userStore";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Trigger from "./Trigger";
import MenuContent from "./MenuContent";

const SideFooter = () => {
  const user = useUserStore((u) => u.user);

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const { user: fetchedUser } = useGetUser(user.id);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Trigger user={fetchedUser} />}
          ></DropdownMenuTrigger>
          {/* content */}
          <MenuContent />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default SideFooter;
