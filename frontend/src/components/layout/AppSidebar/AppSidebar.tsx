import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

import SideHeader from "./SideHeader/SideHeader";
import SideFooter from "./SideFooter/SideFooter";
import NavGroup from "./NavGroup";
import { useUserStore } from "@/store/userStore";
import {
  ADMINISTRATION_LINKS,
  INVESTIGATION_LINKS,
  OVERVIEW_LINKS,
  REPORTS_LINKS,
  type NavLinkItem,
} from "@/constants/links";

const GROUPS: { label: string; links: NavLinkItem[] }[] = [
  { label: "Overview", links: OVERVIEW_LINKS },
  { label: "Investigation", links: INVESTIGATION_LINKS },
  { label: "Reports & Analytics", links: REPORTS_LINKS },
  { label: "Administration", links: ADMINISTRATION_LINKS },
];

const AppSidebar = () => {
  const user = useUserStore((state) => state.user);

  return (
    <Sidebar collapsible='icon'>
      {/* HEADER */}
      <SidebarHeader>
        <SideHeader />
      </SidebarHeader>

      <SidebarContent>
        {/* Only the links this role can use; empty groups are left out. */}
        {GROUPS.map(({ label, links }) => {
          const visible = links.filter((link) => link.canAccess(user));

          return (
            visible.length > 0 && (
              <SidebarGroup key={label}>
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <NavGroup links={visible} />
              </SidebarGroup>
            )
          );
        })}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <SideFooter />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
