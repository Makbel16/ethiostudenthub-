import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, Menu, Search, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland text-white shadow-sm">
              <BookOpen size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-5 text-ink">EthioStudentHub</span>
              <span className="hidden text-xs font-medium text-muted sm:block">Ethiopian academic resources</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/browse" className={linkClass}>
              Browse
            </NavLink>
            <NavLink to="/browse?type=PREVIOUS_EXAM" className={linkClass}>
              Previous exams
            </NavLink>
            {user && (
              <NavLink to="/upload" className={linkClass}>
                Upload
              </NavLink>
            )}
            {user && (
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
            )}
            {user && (user.role === "ADMIN" || user.role === "MODERATOR") && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/browse" className="btn-secondary">
              <Search size={16} />
              Search
            </Link>
            {user ? (
              <>
                <Link to="/upload" className="btn-primary">
                  <UploadCloud size={16} />
                  Add material
                </Link>
                <button onClick={onLogout} className="btn-ghost">
                  Log out
                </button>
              </>
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

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-secondary px-3 lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-line py-3 lg:hidden">
            <nav className="grid gap-1">
              <NavLink to="/browse" onClick={close} className={linkClass}>
                <Search size={16} />
                Browse resources
              </NavLink>
              <NavLink to="/browse?type=PREVIOUS_EXAM" onClick={close} className={linkClass}>
                <BookOpen size={16} />
                Previous exams
              </NavLink>
              {user && (
                <NavLink to="/upload" onClick={close} className={linkClass}>
                  <UploadCloud size={16} />
                  Upload material
                </NavLink>
              )}
              {user && (
                <NavLink to="/dashboard" onClick={close} className={linkClass}>
                  <LayoutDashboard size={16} />
                  Dashboard
                </NavLink>
              )}
              {user && (user.role === "ADMIN" || user.role === "MODERATOR") && (
                <NavLink to="/admin" onClick={close} className={linkClass}>
                  <ShieldCheck size={16} />
                  Admin
                </NavLink>
              )}
            </nav>
            <div className="mt-4 flex gap-2">
              {user ? (
                <button onClick={onLogout} className="btn-secondary flex-1">
                  Log out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={close} className="btn-secondary flex-1">
                    Log in
                  </Link>
                  <Link to="/register" onClick={close} className="btn-primary flex-1">
                    Join free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
