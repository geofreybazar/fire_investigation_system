import { Routes, Route } from "react-router";
import loadable from "@loadable/component";
import Dashboard from "@/pages/Dashboard";
import Personnel from "@/pages/Personnel";
import Offices from "@/pages/Offices";
import Settings from "@/pages/Settings";
import MyProfile from "@/pages/MyProfile";
import Positions from "@/pages/Positions";
import IncidentClassification from "@/pages/IncidentClassification";
import { useUserStore } from "@/store/userStore";
import {
  ADMINISTRATION_LINKS,
  INVESTIGATION_LINKS,
  OVERVIEW_LINKS,
  REPORTS_LINKS,
} from "@/constants/links";
import { canViewCases } from "@/utils/casePermissions";

// The case and investigation pages are split out of the main bundle.
const Cases = loadable(() => import("@/pages/Cases"));
const CaseDetail = loadable(() => import("@/pages/CaseDetail"));
const Investigations = loadable(() => import("@/pages/Investigations"));
const InvestigationDetail = loadable(
  () => import("@/pages/InvestigationDetail"),
);
const AuditLog = loadable(() => import("@/pages/AuditLog"));
// Charts and the map bring large libraries, so they load only when opened.
const Statistics = loadable(() => import("@/pages/Statistics"));
const CaseReports = loadable(() => import("@/pages/CaseReports"));
const CaseMap = loadable(() => import("@/pages/CaseMap"));
const Evidence = loadable(() => import("@/pages/Evidence"));

const routes = [
  { path: "/", element: <Dashboard /> },
  { path: "/casemap", element: <CaseMap /> },
  { path: "/cases", element: <Cases /> },
  { path: "/cases/:id", element: <CaseDetail /> },
  { path: "/investigations", element: <Investigations /> },
  { path: "/investigations/:id", element: <InvestigationDetail /> },
  { path: "/evidence", element: <Evidence /> },
  { path: "/casereports", element: <CaseReports /> },
  { path: "/statistics", element: <Statistics /> },
  { path: "/personnel", element: <Personnel /> },
  { path: "/offices", element: <Offices /> },
  { path: "/settings", element: <Settings /> },
  { path: "/profile", element: <MyProfile /> },
  { path: "/positions", element: <Positions /> },
  { path: "/incidentclassifications", element: <IncidentClassification /> },
  { path: "/auditlog", element: <AuditLog /> },
];

// Each page uses its sidebar link's rule; detail pages follow their list.
const linkAccess = new Map(
  [
    ...OVERVIEW_LINKS,
    ...INVESTIGATION_LINKS,
    ...REPORTS_LINKS,
    ...ADMINISTRATION_LINKS,
  ].map((link) => [link.link, link.canAccess]),
);
linkAccess.set("/cases/:id", canViewCases);
linkAccess.set("/investigations/:id", canViewCases);

// Display only: the backend rejects every request the role can't make.
const RequireAccess = ({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) => {
  const user = useUserStore((state) => state.user);
  const canAccess = linkAccess.get(path);

  if (canAccess && !canAccess(user)) {
    return (
      <div className='rounded-lg border p-10 text-center text-sm text-muted-foreground'>
        This page is not available for your role.
      </div>
    );
  }

  return children;
};

const Router = () => {
  return (
    <Routes>
      {routes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<RequireAccess path={path}>{element}</RequireAccess>}
        />
      ))}
    </Routes>
  );
};
export default Router;
