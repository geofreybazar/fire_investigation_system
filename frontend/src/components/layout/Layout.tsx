import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar/AppSidebar";
import Navbar from "./Navbar/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider className='min-h-screen'>
      <AppSidebar />
      <main className='flex flex-1 flex-col '>
        <Navbar />
        <div className='flex-1 px-3 py-2 md:px-8 md:py-5'>{children}</div>
      </main>
    </SidebarProvider>
  );
};

export default Layout;
