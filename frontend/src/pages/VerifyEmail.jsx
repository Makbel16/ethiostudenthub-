import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/client.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      {status === "verifying" && <p className="text-ink/60">Verifying your email…</p>}
      {status === "success" && (
        <>
          <h1 className="font-display text-2xl font-semibold mb-2">Email verified</h1>
          <p className="text-ink/60 mb-6">You're all set. You can now upload resources.</p>
          <Link to="/browse" className="text-highland font-medium">Go to Browse →</Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-display text-2xl font-semibold mb-2">Link invalid or expired</h1>
          <p className="text-ink/60">Please request a new verification email from your dashboard.</p>
        </>
      )}
    </div>
  );
}
