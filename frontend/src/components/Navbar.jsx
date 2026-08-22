import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  ShieldCheck,
  UploadCloud,
  UserCircle,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

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
      { to: "/", label: "Home", icon: Home },
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
        to: "/admin",
        label: "Admin",
        icon: ShieldCheck,
        roles: ["ADMIN", "MODERATOR"],
        permissions: ["admin:access", "resources:moderate"],
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
  const [open, setOpen] = useState(false);

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
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const close = () => setOpen(false);

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland-light text-highland-dark" : "text-ink/75 hover:bg-mist hover:text-ink"
    }`;

  const sidebarLinkClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-highland text-white shadow-sm" : "text-ink/80 hover:bg-mist hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className={`btn-secondary px-3 ${user ? "" : "lg:hidden"}`}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-controls="site-sidebar"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

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

      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
          aria-label="Close navigation"
        />
        <aside
          id="site-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute left-0 top-0 flex h-full w-80 max-w-[calc(100vw-2rem)] flex-col border-r border-line bg-white shadow-2xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
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
                        <NavLink key={item.to} to={item.to} onClick={close} className={sidebarLinkClass}>
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
    </header>
  );
}
