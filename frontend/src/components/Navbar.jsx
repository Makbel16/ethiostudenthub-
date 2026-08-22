import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, Routes, Route } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  Home as HomeIcon,
  LayoutDashboard,
  Layers3,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Search,
  ShieldCheck,
  UploadCloud,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Home from "../pages/Home.jsx";
import Browse from "../pages/Browse.jsx";
import ResourceDetail from "../pages/ResourceDetail.jsx";
import UniversityDirectory from "../pages/UniversityDirectory.jsx";
import UniversityDetail from "../pages/UniversityDetail.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Upload from "../pages/Upload.jsx";
import Admin from "../pages/Admin.jsx";
import AdminModeration from "../pages/AdminModeration.jsx";
import AdminUsers from "../pages/AdminUsers.jsx";
import AdminUniversities from "../pages/AdminUniversities.jsx";
import AdminStructure from "../pages/AdminStructure.jsx";
import UniversityManager from "../pages/UniversityManager.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import Footer from "./Footer.jsx";
import GpaCalculator from "../pages/GpaCalculator.jsx";
import AcademicRoadmap from "../pages/AcademicRoadmap.jsx";
import StudyPlanner from "../pages/StudyPlanner.jsx";
import Scholarships from "../pages/Scholarships.jsx";
import JobsInternships from "../pages/JobsInternships.jsx";
import Notifications from "../pages/Notifications.jsx";

const ROLE_PERMISSIONS = {
  GUEST: [],
  STUDENT: [],
  UNIVERSITY_REP: ["university-manager:access"],
  MODERATOR: ["admin:access", "resources:moderate"],
  ADMIN: ["admin:access", "resources:moderate", "users:manage"],
};

const NAV_SECTIONS = [
  {
    label: "Explore",
    items: [
      { to: "/", label: "Home", icon: HomeIcon },
      { to: "/universities", label: "Universities", icon: Building2, topNav: true },
      { to: "/browse", label: "Browse", icon: Search, topNav: true },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/upload", label: "Upload", icon: UploadCloud, authOnly: true },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authOnly: true },
    ],
  },
  {
    label: "Student Tools",
    items: [
      { to: "/gpa-calculator", label: "GPA Calculator", icon: Calculator, authOnly: true },
      { to: "/academic-roadmap", label: "Academic Roadmap", icon: MapPin, authOnly: true },
      { to: "/study-planner", label: "Study Planner", icon: Calendar, authOnly: true },
      { to: "/scholarships", label: "Scholarships", icon: Award, authOnly: true },
      { to: "/jobs-internships", label: "Jobs & Internships", icon: Briefcase, authOnly: true },
      { to: "/notifications", label: "Notifications", icon: Bell, authOnly: true },
    ],
  },
  {
    label: "Management",
    items: [
      {
        to: "/university-manager",
        label: "Manage University",
        icon: Megaphone,
        roles: ["UNIVERSITY_REP"],
        permissions: ["university-manager:access"],
      },
      {
        to: "/admin/moderation",
        label: "Moderation",
        icon: ShieldCheck,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["resources:moderate"],
      },
      {
        to: "/admin/users",
        label: "Users",
        icon: UsersRound,
        roles: ["ADMIN"],
        permissions: ["users:manage"],
      },
      {
        to: "/admin/universities",
        label: "Universities",
        icon: Building2,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["admin:access"],
      },
      {
        to: "/admin/structure",
        label: "Structure",
        icon: Layers3,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["admin:access"],
      },
    ],
  },
];

const getUserPermissions = (user) => {
  const rolePermissions = ROLE_PERMISSIONS[user?.role] ?? [];
  const explicitPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return new Set([...rolePermissions, ...explicitPermissions]);
};

const canViewItem = (item, user) => {
  if (item.authOnly && !user) return false;

  const requiresRole = Array.isArray(item.roles) && item.roles.length > 0;
  const requiresPermission = Array.isArray(item.permissions) && item.permissions.length > 0;

  if (!requiresRole && !requiresPermission) return true;
  if (!user) return false;

  const roleAllowed = requiresRole && item.roles.includes(user.role);
  const permissions = getUserPermissions(user);
  const permissionAllowed = requiresPermission && item.permissions.some((permission) => permissions.has(permission));

  if (requiresRole && !roleAllowed) return false;
  if (requiresPermission && !permissionAllowed) return false;

  return true;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => canViewItem(item, user)),
      })).filter((section) => section.items.length > 0),
    [user]
  );

  const topNavItems = visibleSections.flatMap((section) => section.items).filter((item) => item.topNav);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const onLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const close = () => setMobileOpen(false);

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland-light text-highland-dark" : "text-ink/75 hover:bg-mist hover:text-ink"
    }`;

  const sidebarLinkClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland text-white shadow-sm" : "text-ink/80 hover:bg-mist hover:text-ink"
    } ${desktopCollapsed ? "justify-center px-2" : ""}`;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Persistent on large screens */}
      {user && (
        <aside
          className={`hidden lg:flex flex-col border-r border-line bg-white transition-all duration-200 fixed left-0 top-0 h-screen ${
            desktopCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-line px-4">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-highland text-white shadow-sm">
                <BookOpen size={20} />
              </span>
              {!desktopCollapsed && (
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-semibold leading-5 text-ink">
                    EthioStudentHub
                  </span>
                  <span className="block truncate text-xs font-medium text-muted">Navigation</span>
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="btn-ghost h-10 w-10 px-0"
              aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {desktopCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          </div>

          <div className="border-b border-line px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist text-highland">
                <UserCircle size={22} />
              </span>
              {!desktopCollapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{user.fullName || user.email}</span>
                  <span className="block truncate text-xs font-medium text-muted">{user.role?.replaceAll("_", " ")}</span>
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="grid gap-5">
              {visibleSections.map((section) => (
                <div key={section.label}>
                  {!desktopCollapsed && <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted">{section.label}</p>}
                  <div className="grid gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink key={item.to} to={item.to} className={sidebarLinkClass} title={desktopCollapsed ? item.label : undefined}>
                          <Icon size={18} className="shrink-0" />
                          {!desktopCollapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-line p-4">
            <button onClick={onLogout} className="btn-secondary w-full" title={desktopCollapsed ? "Log out" : undefined}>
              <LogOut size={16} />
              {!desktopCollapsed && "Log out"}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col transition-all duration-200 ${user ? (desktopCollapsed ? "lg:ml-16" : "lg:ml-64") : ""}`}>
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-sm backdrop-blur">
          <div className="page-shell">
            <div className="flex h-16 items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                {user && (
                  <button
                    type="button"
                    onClick={() => setMobileOpen((value) => !value)}
                    className="btn-secondary px-3 lg:hidden"
                    aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                    aria-controls="mobile-sidebar"
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                )}

                <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland text-white shadow-sm">
                    <BookOpen size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-semibold leading-5 text-ink">EthioStudentHub</span>
                    <span className="hidden text-xs font-medium text-muted sm:block">Ethiopian academic resources</span>
                  </span>
                </Link>
              </div>

              <nav className="hidden items-center gap-3 lg:flex">
                {topNavItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <Link to="/browse" className="btn-secondary">
                  <Search size={16} />
                  Search
                </Link>
                {user ? (
                  <button onClick={onLogout} className="btn-ghost">
                    Log out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost">
                      Log in
                    </Link>
                    <Link to="/register" className="btn-primary">
                      Join free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay - Only for logged-in users */}
        {user && (
          <div className={`fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
            <button
              type="button"
              className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
                mobileOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={close}
              aria-label="Close navigation"
            />
            <aside
              id="mobile-sidebar"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className={`absolute left-0 top-0 flex h-screen w-80 max-w-[calc(100vw-2rem)] flex-col border-r border-line bg-white shadow-2xl transition-transform duration-200 ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-line px-4">
              <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-highland text-white shadow-sm">
                  <BookOpen size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-semibold leading-5 text-ink">
                    EthioStudentHub
                  </span>
                  <span className="block truncate text-xs font-medium text-muted">Navigation</span>
                </span>
              </Link>
              <button type="button" onClick={close} className="btn-ghost h-10 w-10 px-0" aria-label="Close navigation">
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="border-b border-line px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist text-highland">
                    <UserCircle size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{user.fullName || user.email}</span>
                    <span className="block truncate text-xs font-medium text-muted">{user.role?.replaceAll("_", " ")}</span>
                  </span>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="grid gap-5">
                {visibleSections.map((section) => (
                  <div key={section.label}>
                    <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted">{section.label}</p>
                    <div className="grid gap-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink key={item.to} to={item.to} onClick={close} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors text-ink/80 hover:bg-mist hover:text-ink">
                            <Icon size={18} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            <div className="border-t border-line p-4">
              {user ? (
                <button onClick={onLogout} className="btn-secondary w-full">
                  <LogOut size={16} />
                  Log out
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link to="/login" onClick={close} className="btn-secondary w-full">
                    Log in
                  </Link>
                  <Link to="/register" onClick={close} className="btn-primary w-full">
                    Join free
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/universities" element={<UniversityDirectory />} />
            <Route path="/universities/:idOrSlug" element={<UniversityDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gpa-calculator"
              element={
                <ProtectedRoute>
                  <GpaCalculator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic-roadmap"
              element={
                <ProtectedRoute>
                  <AcademicRoadmap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-planner"
              element={
                <ProtectedRoute>
                  <StudyPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scholarships"
              element={
                <ProtectedRoute>
                  <Scholarships />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs-internships"
              element={
                <ProtectedRoute>
                  <JobsInternships />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute roles={["ADMIN", "MODERATOR"]}>
                  <AdminModeration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/universities"
              element={
                <ProtectedRoute roles={["ADMIN", "MODERATOR"]}>
                  <AdminUniversities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/structure"
              element={
                <ProtectedRoute roles={["ADMIN", "MODERATOR"]}>
                  <AdminStructure />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ADMIN", "MODERATOR"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/university-manager"
              element={
                <ProtectedRoute roles={["UNIVERSITY_REP"]}>
                  <UniversityManager />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}
