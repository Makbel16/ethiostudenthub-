import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Send } from "lucide-react";
import api from "../api/client.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email });
    setSent(true);
  };

  return (
    <div className="page-shell py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-highland-light text-highland">
          <MailCheck size={24} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Reset your password</h1>
        {sent ? (
          <div className="mt-5">
            <p className="text-sm leading-6 text-muted">
              If an account exists for <span className="font-semibold text-ink">{email}</span>, a reset link is on its way.
              Check your inbox.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label className="field-label">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="input-field"
              />
            </div>
            <button className="btn-dark w-full">
              <Send size={16} />
              Send reset link
            </button>
            <p className="text-center text-sm text-muted">
              Remembered it? <Link to="/login" className="font-semibold text-highland hover:underline">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
