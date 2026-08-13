import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, LogIn, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post("/auth/login", values);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError("root", { message: err.response?.data?.error || "Login failed" });
    }
  };

  return (
    <div className="page-shell py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-line bg-white shadow-lg lg:grid-cols-[1fr_420px]">
        <section className="bg-ink p-8 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-highland">
            <BookOpen size={25} />
          </div>
          <h1 className="mt-8 font-display text-4xl font-semibold leading-tight">
            Continue your academic resource workflow.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Access your uploads, bookmarks, notifications, and moderation tools from one focused student account.
          </p>
          <div className="mt-8 rounded-xl bg-white/8 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={17} className="text-gold" />
              Protected by JWT authentication
            </p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              The frontend sends your access token to the configured API for protected actions.
            </p>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Log in</h2>
          <p className="mt-2 text-sm text-muted">Use your EthioStudentHub account to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="field-label">Email</label>
              <input {...register("email")} type="email" className="input-field" />
              {errors.email && <p className="mt-1 text-xs font-semibold text-ember">{errors.email.message}</p>}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-ink">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-highland hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input type="password" {...register("password")} className="input-field" />
              {errors.password && <p className="mt-1 text-xs font-semibold text-ember">{errors.password.message}</p>}
            </div>
            {errors.root && (
              <div className="rounded-lg border border-ember/25 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
                {errors.root.message}
              </div>
            )}
            <button disabled={isSubmitting} className="btn-dark w-full">
              <LogIn size={17} />
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            New to EthioStudentHub?{" "}
            <Link to="/register" className="font-semibold text-highland hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
