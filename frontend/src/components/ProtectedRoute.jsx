import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="max-w-6xl mx-auto px-6 py-12 text-ink/60">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <p className="max-w-6xl mx-auto px-6 py-12 text-ink/60">You don't have access to this page.</p>;
  }
  return children;
}
