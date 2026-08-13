import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import api from "../api/client.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { token: params.get("token"), password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="page-shell py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-highland-light text-highland">
          <KeyRound size={24} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Choose a password with at least 8 characters.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="field-label">New password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
              className="input-field"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-ember/25 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
              {error}
            </div>
          )}
          <button className="btn-dark w-full">Update password</button>
          <p className="text-center text-sm text-muted">
            <Link to="/login" className="font-semibold text-highland hover:underline">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
