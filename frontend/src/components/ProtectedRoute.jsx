import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="page-shell py-12 text-sm text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">You do not have access to this page.</div>
      </div>
    );
  }
  return children;
}
