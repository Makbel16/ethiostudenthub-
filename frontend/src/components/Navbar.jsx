import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, Routes, Route } from "react-router-dom";
import {
  Award,
  Bell,
  Bot,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Home as HomeIcon,
  LayoutDashboard,
  Layers3,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Compass,
  Sun,
  UploadCloud,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useDarkMode } from "../context/DarkModeContext.jsx";
import api from "../api/client.js";
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
import QA from "../pages/QA.jsx";
import CareerCenter from "../pages/CareerCenter.jsx";
import CVBuilder from "../pages/CVBuilder.jsx";
import AIAssistant from "../pages/AIAssistant.jsx";
import Recommendations from "../pages/Recommendations.jsx";

const getInitials = (name = "") => {
  const parts = String(name || "").trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name[0] || "U").toUpperCase();
};

const ROLE_PERMISSIONS = {
  GUEST: [],
  STUDENT: [],
  UNIVERSITY_REP: ["university-manager:access"],
  MODERATOR: ["admin:access", "resources:moderate"],
  ADMIN: ["admin:access", "resources:moderate", "users:manage"],
};

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authOnly: true },
      { to: "/upload", label: "Upload Resource", icon: UploadCloud, authOnly: true },
      { to: "/notifications", label: "Notifications", icon: Bell, authOnly: true },
    ],
  },
  {
    label: "Explore & Network",
    items: [
      { to: "/browse", label: "Browse Library", icon: Search, topNav: true },
      { to: "/universities", label: "Universities", icon: Building2, topNav: true },
      { to: "/recommendations", label: "Curated For You", icon: Compass, authOnly: true },
    ],
  },
  {
    label: "Academic Tools",
    items: [
      { to: "/gpa-calculator", label: "GPA Calculator", icon: Calculator, authOnly: true },
      { to: "/academic-roadmap", label: "Academic Roadmap", icon: MapPin, authOnly: true },
      { to: "/study-planner", label: "Study Planner", icon: Calendar, authOnly: true },
      { to: "/qa", label: "Peer Q&A", icon: MessageSquare, authOnly: true },
      { to: "/ai-assistant", label: "Study Assistant", icon: Bot, authOnly: true },
    ],
  },
  {
    label: "Career Center",
    items: [
      { to: "/scholarships", label: "Scholarships", icon: Award, authOnly: true },
      { to: "/jobs-internships", label: "Jobs & Internships", icon: Briefcase, authOnly: true },
      { to: "/career-center", label: "Career Center", icon: Briefcase, authOnly: true },
      { to: "/cv-builder", label: "CV Builder", icon: FileText, authOnly: true },
    ],
  },
  {
    label: "Administration",
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
        label: "Moderation Queue",
        icon: ShieldCheck,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["resources:moderate"],
      },
      {
        to: "/admin/users",
        label: "User Management",
        icon: UsersRound,
        roles: ["ADMIN"],
        permissions: ["users:manage"],
      },
      {
        to: "/admin/universities",
        label: "Campus Directory",
        icon: Building2,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["admin:access"],
      },
      {
        to: "/admin/structure",
        label: "Curriculum Structure",
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
  const { user, logout, setUser, unreadCount } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    try {
      return localStorage.getItem("esh_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const toggleDesktopCollapse = (nextState) => {
    setDesktopCollapsed(nextState);
    try {
      localStorage.setItem("esh_sidebar_collapsed", String(nextState));
    } catch {}
  };

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => canViewItem(item, user)),
      })).filter((section) => section.items.length > 0),
    [user]
  );

  const toggleSection = (sectionLabel) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel],
    }));
  };

  // Auto-expand sections that contain the current active route
  useEffect(() => {
    const activeSection = visibleSections.find((section) =>
      section.items.some((item) => item.to === location.pathname)
    );
    if (activeSection) {
      setExpandedSections((prev) => ({
        ...prev,
        [activeSection.label]: true,
      }));
    }
  }, [location.pathname, visibleSections]);

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

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update user context with new avatar URL
      if (setUser && user) {
        setUser({ ...user, avatarUrl: response.data.avatarUrl });
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland-light text-highland-dark" : "text-ink/75 dark:text-dark-text/75 hover:bg-mist dark:hover:bg-dark-border hover:text-ink dark:hover:text-dark-text"
    }`;

  const sidebarLinkClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland text-white shadow-sm" : "text-ink/80 dark:text-dark-text/80 hover:bg-mist dark:hover:bg-dark-border hover:text-ink dark:hover:text-dark-text"
    } ${desktopCollapsed ? "justify-center px-2" : ""}`;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - Full width at top */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-sm backdrop-blur dark:bg-dark-surface/95 dark:border-dark-border">
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
                  <span className="block font-display text-xl font-semibold leading-5 text-ink dark:text-dark-text">EthioStudentHub</span>
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
              <button
                onClick={toggleDarkMode}
                className="btn-secondary"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
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

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar - Sticky in flex flow so it never overlaps or hides main content */}
        {user && (
          <aside
            className={`hidden lg:flex flex-col border-r border-line/70 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md transition-all duration-300 ease-in-out sticky top-16 h-[calc(100vh-4rem)] shrink-0 dark:border-dark-border/70 z-30 shadow-xs ${
              desktopCollapsed ? "w-[68px]" : "w-64"
            }`}
          >
            {/* Header / Collapse Bar */}
            {!desktopCollapsed ? (
              /* EXPANDED HEADER: Profile Photo + Info on Left, Collapse button situated to the RIGHT of profile */
              <div className="flex items-center justify-between gap-3 border-b border-line/70 dark:border-dark-border/70 p-3.5 bg-paper/40 dark:bg-dark-bg/30">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative group shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highland text-white font-bold text-sm shadow-xs overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <span>{getInitials(user.fullName || user.email)}</span>
                      )}
                    </div>
                    <label
                      className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl transition-opacity cursor-pointer ${
                        uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      title="Upload profile photo"
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={uploadingAvatar}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                      {uploadingAvatar ? (
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <UploadCloud size={15} className="text-white" />
                      )}
                    </label>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink text-xs sm:text-sm dark:text-white leading-tight">
                      {user.fullName || user.email}
                    </p>
                    <span className="inline-block mt-0.5 rounded-md bg-highland/10 dark:bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-highland-dark dark:text-emerald-300 border border-highland/15 dark:border-emerald-500/20">
                      {user.role?.replaceAll("_", " ") || "STUDENT"}
                    </span>
                  </div>
                </div>

                {/* Collapse button situated directly to the RIGHT of the profile */}
                <button
                  type="button"
                  onClick={() => toggleDesktopCollapse(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist dark:hover:bg-dark-border border border-line/60 dark:border-dark-border/60 transition-colors cursor-pointer shrink-0"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            ) : (
              /* COLLAPSED HEADER: Profile photo is completely INVISIBLE! Only the expand button is shown */
              <div className="flex items-center justify-center py-3 border-b border-line/70 dark:border-dark-border/70 bg-paper/40 dark:bg-dark-bg/30">
                <button
                  type="button"
                  onClick={() => toggleDesktopCollapse(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-ink/75 hover:text-highland hover:bg-highland/10 dark:text-dark-text/75 dark:hover:text-white dark:hover:bg-dark-border border border-line/60 dark:border-dark-border/60 transition-all cursor-pointer group shadow-2xs"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Navigation Body */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 no-scrollbar">
              {!desktopCollapsed ? (
                /* EXPANDED NAVIGATION */
                <div className="space-y-4">
                  {visibleSections.map((section) => {
                    const isExpanded = expandedSections[section.label] !== false;
                    return (
                      <div key={section.label} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.label)}
                          className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white transition-colors cursor-pointer group"
                        >
                          <span>{section.label}</span>
                          {isExpanded ? (
                            <ChevronDown size={13} className="text-muted group-hover:text-ink dark:group-hover:text-white transition-colors" />
                          ) : (
                            <ChevronRight size={13} className="text-muted group-hover:text-ink dark:group-hover:text-white transition-colors" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="space-y-0.5">
                            {section.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <NavLink
                                  key={item.to}
                                  to={item.to}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                      isActive
                                        ? "bg-highland text-white shadow-xs font-semibold"
                                        : "text-ink/80 dark:text-dark-text/80 hover:bg-mist dark:hover:bg-dark-border hover:text-highland dark:hover:text-emerald-400"
                                    }`
                                  }
                                >
                                  <ItemIcon size={16} className="shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                  {item.to === "/notifications" && unreadCount > 0 && (
                                    <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                                      {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* COLLAPSED NAVIGATION: Clean, centered icon rail with tooltips */
                <div className="space-y-2">
                  {visibleSections.map((section) => (
                    <div
                      key={section.label}
                      className="py-1.5 border-b border-line/40 dark:border-dark-border/40 last:border-0 flex flex-col items-center gap-1.5"
                    >
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.to} className="relative group flex items-center justify-center">
                            <NavLink
                              to={item.to}
                              className={({ isActive }) =>
                                `relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                  isActive
                                    ? "bg-highland text-white shadow-xs font-bold"
                                    : "text-ink/70 hover:text-highland hover:bg-highland/10 dark:text-dark-text/70 dark:hover:text-emerald-400 dark:hover:bg-dark-border"
                                }`
                              }
                              title={item.label}
                            >
                              <ItemIcon size={18} />
                              {item.to === "/notifications" && unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-surface" />
                              )}
                            </NavLink>
                            {/* Floating tooltip on hover */}
                            <div className="absolute left-full ml-2.5 hidden group-hover:flex items-center z-50 pointer-events-none">
                              <div className="px-2.5 py-1 text-xs font-medium text-white bg-ink/90 dark:bg-dark-surface dark:text-dark-text dark:border dark:border-dark-border rounded-lg shadow-lg whitespace-nowrap">
                                {item.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </nav>

            {/* Sidebar Bottom Footer */}
            <div className="border-t border-line/70 p-3 dark:border-dark-border/70 bg-paper/40 dark:bg-dark-bg/30">
              <button
                type="button"
                onClick={onLogout}
                className={`flex items-center justify-center rounded-xl border border-line/80 text-muted hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 dark:border-dark-border dark:text-dark-muted dark:hover:text-red-400 transition-all cursor-pointer ${
                  desktopCollapsed ? "h-10 w-10 mx-auto" : "w-full gap-2 px-3 py-2 text-xs font-semibold"
                }`}
                title={desktopCollapsed ? "Log out" : undefined}
              >
                <LogOut size={16} className="shrink-0" />
                {!desktopCollapsed && <span>Log out</span>}
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
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
                className={`absolute left-0 top-0 flex h-screen w-80 max-w-[calc(100vw-2rem)] flex-col border-r border-line bg-white shadow-2xl transition-transform duration-200 dark:bg-dark-surface dark:border-dark-border ${
                  mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div className="flex min-h-16 items-center justify-between gap-3 border-b border-line px-4 dark:border-dark-border">
                  <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-highland text-white shadow-sm">
                      <BookOpen size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-semibold leading-5 text-ink dark:text-dark-text">
                        EthioStudentHub
                      </span>
                      <span className="block truncate text-xs font-medium text-muted dark:text-dark-muted">Navigation</span>
                    </span>
                  </Link>
                  <button type="button" onClick={close} className="btn-ghost h-10 w-10 px-0" aria-label="Close navigation">
                    <X size={20} />
                  </button>
                </div>

                {user && (
                  <div className="border-b border-line px-4 py-4 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist dark:bg-dark-border text-highland">
                        <UserCircle size={22} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink dark:text-dark-text">{user.fullName || user.email}</span>
                        <span className="block truncate text-xs font-medium text-muted dark:text-dark-muted">{user.role?.replaceAll("_", " ")}</span>
                      </span>
                    </div>
                  </div>
                )}

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                  <div className="grid gap-2">
                    {visibleSections.map((section) => {
                      const isExpanded = expandedSections[section.label];
                      const Icon = section.items[0]?.icon;
                      return (
                        <div key={section.label}>
                          <button
                            onClick={() => toggleSection(section.label)}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                              isExpanded ? "bg-mist dark:bg-dark-border text-ink dark:text-dark-text" : "text-ink/80 dark:text-dark-text/80 hover:bg-mist dark:hover:bg-dark-border hover:text-ink dark:hover:text-dark-text"
                            }`}
                          >
                            {Icon && <Icon size={18} className="shrink-0" />}
                            <span className="flex-1 truncate">{section.label}</span>
                            {isExpanded ? (
                              <ChevronDown size={16} className="shrink-0 text-muted dark:text-dark-muted" />
                            ) : (
                              <ChevronRight size={16} className="shrink-0 text-muted dark:text-dark-muted" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="ml-4 mt-1 grid gap-1">
                              {section.items.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                  <NavLink key={item.to} to={item.to} onClick={close} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors text-ink/80 dark:text-dark-text/80 hover:bg-mist dark:hover:bg-dark-border hover:text-ink dark:hover:text-dark-text">
                                    <ItemIcon size={16} className="shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </nav>

                <div className="border-t border-line p-4 dark:border-dark-border">
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
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
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
              path="/qa"
              element={
                <ProtectedRoute>
                  <QA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career-center"
              element={
                <ProtectedRoute>
                  <CareerCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cv-builder"
              element={
                <ProtectedRoute>
                  <CVBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
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
    </div>
  );
}
