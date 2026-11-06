import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import logo from "@/assets/bfp.svg";
const SideHeader = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton className='h-auto'>
          <img
            src={logo}
            alt='Bureau of Fire Protection logo'
            className='w-15'
          />

          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className=' font-semibold'>BUREAU OF FIRE PROTECTION</span>

            <span className=' text-xs text-muted-foreground'>
              Fire Investigation and Suppression System
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default SideHeader;
