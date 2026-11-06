import { useNavigate } from "react-router";
import { useState } from "react";
import authService from "@/service/auth.service";
import { useUserStore } from "@/store/userStore";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import { LogOut, Settings, User } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

const MenuContent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toggleSidebar, isMobile } = useSidebar();

  const [openLogout, setOpenLogout] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      useUserStore.getState().logout();
      localStorage.removeItem("user");
      setIsLoading(false);
      navigate("/login", {
        replace: true,
      });
    }
  };

  const action = {
    label: isLoading ? "Logging out" : "Logout",
    onClick: () => handleLogout(),
  };

  return (
    <>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => {
            if (isMobile) {
              toggleSidebar();
            }
            navigate("/profile");
          }}
        >
          <User />
          <span>My Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => {
            if (isMobile) {
              toggleSidebar();
            }
            navigate("/settings");
          }}
        >
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setOpenLogout(true)}
          className='text-destructive focus:text-destructive cursor-pointer'
        >
          <LogOut />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AlertDialogComponent
        open={openLogout}
        setOpen={setOpenLogout}
        title={"Logout"}
        description={"Are you sure you want to log out? "}
        action={action}
      />
    </>
  );
};

export default MenuContent;
