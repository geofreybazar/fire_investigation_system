import {
  canManageClassifications,
  canViewCases,
  isAdmin,
} from "@/utils/casePermissions";

// `canAccess` only decides what the sidebar shows and which pages render; the
// backend enforces every permission.

interface LinkUser {
  id: string;
  role: string;
  officeId: string;
}

export interface NavLinkItem {
  link: string;
  label: string;
  icon: string;
  canAccess: (user?: LinkUser | null) => boolean;
  // Planned but not built yet: shown with a "Soon" tag.
  comingSoon?: boolean;
}

const everyone = (user?: LinkUser | null) => !!user;

export const OVERVIEW_LINKS: NavLinkItem[] = [
  {
    link: "/",
    label: "Dashboard",
    icon: "Dashboard",
    canAccess: everyone,
  },
  {
    link: "/casemap",
    label: "Case Map",
    icon: "Map",
    canAccess: canViewCases,
  },
];

export const INVESTIGATION_LINKS: NavLinkItem[] = [
  {
    link: "/cases",
    label: "Cases",
    icon: "FolderSearch",
    canAccess: canViewCases,
  },
  {
    link: "/investigations",
    label: "Investigations",
    icon: "Search",
    canAccess: canViewCases,
  },
  {
    link: "/evidence",
    label: "Evidence",
    icon: "Shield",
    canAccess: canViewCases,
  },
];

export const REPORTS_LINKS: NavLinkItem[] = [
  {
    link: "/casereports",
    label: "Case Reports",
    icon: "FileText",
    canAccess: canViewCases,
  },

  {
    link: "/statistics",
    label: "Statistics & Analytics",
    icon: "BarChart3",
    canAccess: canViewCases,
  },
];

export const ADMINISTRATION_LINKS: NavLinkItem[] = [
  {
    link: "/personnel",
    label: "Personnel",
    icon: "Users",
    canAccess: isAdmin,
  },
  {
    link: "/positions",
    label: "Positions",
    icon: "BriefcaseBusiness",
    canAccess: isAdmin,
  },
  {
    link: "/offices",
    label: "Offices",
    icon: "Building",
    canAccess: isAdmin,
  },
  {
    link: "/incidentclassifications",
    label: "Fire Classifications",
    icon: "Shapes",
    canAccess: canManageClassifications,
  },
  {
    link: "/auditlog",
    label: "Audit Log",
    icon: "History",
    canAccess: isAdmin,
  },
];
