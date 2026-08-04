import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <BookOpen size={22} className="text-highland" />
          EthioStudentHub
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-body text-sm">
          <Link to="/browse" className="hover:text-highland transition-colors">Browse resources</Link>
          <a href="#exams" className="hover:text-highland transition-colors">Previous exams</a>
          <a href="#scholarships" className="hover:text-highland transition-colors">Scholarships</a>
          <a href="#community" className="hover:text-highland transition-colors">Community</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                <Link to="/admin" className="text-sm font-medium hover:text-highland transition-colors">
                  Admin
                </Link>
              )}
              <Link to="/dashboard" className="text-sm font-medium hover:text-highland transition-colors">
                Dashboard
              </Link>
              <button onClick={onLogout} className="text-sm font-medium text-ink/60 hover:text-highland transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-highland transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-ink text-paper px-4 py-2 rounded-sm hover:bg-highland transition-colors"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
