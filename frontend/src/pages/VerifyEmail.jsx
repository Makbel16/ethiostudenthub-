import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailWarning } from "lucide-react";
import api from "../api/client.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("verifying");

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
    <div className="page-shell py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-lg">
        {status === "verifying" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-highland-light text-highland dark:bg-highland/20">
              <MailWarning size={24} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Verifying email</h1>
            <p className="mt-2 text-sm text-muted">Please wait while we confirm your verification link.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-highland-light text-highland dark:bg-highland/20">
              <CheckCircle2 size={24} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Email verified</h1>
            <p className="mt-2 text-sm text-muted">You are ready to browse, upload, and manage your resources.</p>
            <Link to="/browse" className="btn-primary mt-6 w-full">Go to Browse</Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <MailWarning size={24} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Link invalid or expired</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Please request a new verification email from your dashboard when that action is available.
            </p>
            <Link to="/dashboard" className="btn-secondary mt-6 w-full">Open dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
}
