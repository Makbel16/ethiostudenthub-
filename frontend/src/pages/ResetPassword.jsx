import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold mb-4">Set a new password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            required
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-highland transition-colors">
          Update password
        </button>
      </form>
    </div>
  );
}
