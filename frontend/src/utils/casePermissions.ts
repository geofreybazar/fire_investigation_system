import {
  CHIEF_INVESTIGATOR_ROLES,
  INVESTIGATOR_ROLES,
  NO_CASE_ACCESS_ROLES,
} from "@/constants/investigation";

// Which controls to show. The backend enforces every one of these rules;
// hiding a button is never the access check.

interface CurrentUser {
  id: string;
  role: string;
  officeId: string;
}

export const isSuperAdmin = (user?: CurrentUser | null) =>
  user?.role === "SUPER_ADMIN";

export const canViewCases = (user?: CurrentUser | null) =>
  !!user && !NO_CASE_ACCESS_ROLES.includes(user.role);

export const isChiefInvestigator = (user?: CurrentUser | null) =>
  !!user && CHIEF_INVESTIGATOR_ROLES.includes(user.role);

// Chief investigators at any level (and SUPER_ADMIN) open cases.
export const canCreateCases = (user?: CurrentUser | null) =>
  isChiefInvestigator(user) || isSuperAdmin(user);

export const isInvestigator = (user?: CurrentUser | null) =>
  !!user && INVESTIGATOR_ROLES.includes(user.role);

// Mirrors @Roles on the users, offices and positions controllers.
const ADMIN_ROLES = ["SUPER_ADMIN", "NHQ_ADMIN", "REGIONAL_ADMIN"];

// Mirrors @Roles on the categories controller for writes.
const CLASSIFICATION_MANAGER_ROLES = [
  "SUPER_ADMIN",
  "NHQ_ADMIN",
  "NHQ_CHIEF_INVESTIGATOR",
  "NHQ_INVESTIGATOR",
];

export const isAdmin = (user?: CurrentUser | null) =>
  !!user && ADMIN_ROLES.includes(user.role);

export const canManageClassifications = (user?: CurrentUser | null) =>
  !!user && CLASSIFICATION_MANAGER_ROLES.includes(user.role);
