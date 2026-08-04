import { useState } from "react";
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
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold mb-4">Reset your password</h1>
      {sent ? (
        <p className="text-ink/60">
          If an account exists for {email}, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland"
            />
          </div>
          <button className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-highland transition-colors">
            Send reset link
          </button>
        </form>
      )}
    </div>
  );
}
