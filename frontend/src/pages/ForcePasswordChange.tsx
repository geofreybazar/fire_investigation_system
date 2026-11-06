import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/features/settings/security/ChangePassword";
import authService from "@/service/auth.service";
import { useUserStore } from "@/store/userStore";
import type { User } from "@/interface/users/users";

// Shown instead of the app until the default password is changed (Q-19).
// The backend refuses every other request until then.
const ForcePasswordChange = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const leave = () => {
    useUserStore.getState().logout();
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      leave();
    }
  };

  const onChanged = async () => {
    try {
      await authService.refreshSession();
    } catch {
      // The password did change; signing in again issues clean tokens.
      leave();
      return;
    }

    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8'>
      <Card className='w-full max-w-md rounded-2xl border-t-4 border-t-primary shadow-md'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-xl tracking-wide'>
            Change your password
          </CardTitle>
          <CardDescription>
            You are using the default password. Choose a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <ChangePasswordForm userId={user.id} onChanged={onChanged} />
          <Button variant='ghost' onClick={logout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForcePasswordChange;
