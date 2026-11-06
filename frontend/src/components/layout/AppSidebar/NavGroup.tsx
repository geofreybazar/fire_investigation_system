import { NavLink, useLocation } from "react-router";
import {
  useSidebar,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavLinkItem } from "@/constants/links";
import { NAV_ICONS } from "./navIcons";

// A link is active on its own page and on its detail pages
// (e.g. /cases/:id); the dashboard only on "/".
const isActiveLink = (link: string, pathname: string) =>
  link === "/"
    ? pathname === "/"
    : pathname === link || pathname.startsWith(`${link}/`);

const NavGroup = ({ links }: { links: NavLinkItem[] }) => {
  const { toggleSidebar, isMobile } = useSidebar();
  const { pathname } = useLocation();

  return (
    <SidebarGroupContent>
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.link}>
            <SidebarMenuButton
              isActive={isActiveLink(link.link, pathname)}
              tooltip={link.label}
              render={<NavLink to={link.link} />}
              onClick={() => {
                if (isMobile) {
                  toggleSidebar();
                }
              }}
            >
              {NAV_ICONS[link.icon]}
              <span>{link.label}</span>
              {link.comingSoon && (
                <span className='ml-auto rounded-sm border px-1 text-[10px] font-medium text-muted-foreground'>
                  Soon
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );
};

export default NavGroup;
