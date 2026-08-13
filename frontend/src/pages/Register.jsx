import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CheckCircle2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});

export default function Register() {
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
      const { data } = await api.post("/auth/register", values);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError("root", { message: err.response?.data?.error || "Registration failed" });
    }
  };

  return (
    <div className="page-shell py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-line bg-white shadow-lg lg:grid-cols-[1fr_420px]">
        <section className="bg-highland p-8 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-highland">
            <BookOpen size={25} />
          </div>
          <h1 className="mt-8 font-display text-4xl font-semibold leading-tight">
            Join a clearer academic resource network.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
            Create an account to upload materials, save resources, comment, and build your contributor profile.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {["Upload resources for review", "Bookmark useful files", "Track your student dashboard"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="p-8 sm:p-10">
          <p className="eyebrow">Create account</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Join EthioStudentHub</h2>
          <p className="mt-2 text-sm text-muted">Start with your name, email, and a secure password.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="field-label">Full name</label>
              <input {...register("fullName")} className="input-field" />
              {errors.fullName && <p className="mt-1 text-xs font-semibold text-ember">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="field-label">Email</label>
              <input {...register("email")} type="email" className="input-field" />
              {errors.email && <p className="mt-1 text-xs font-semibold text-ember">{errors.email.message}</p>}
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" {...register("password")} className="input-field" />
              {errors.password && <p className="mt-1 text-xs font-semibold text-ember">{errors.password.message}</p>}
            </div>
            {errors.root && (
              <div className="rounded-lg border border-ember/25 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
                {errors.root.message}
              </div>
            )}
            <button disabled={isSubmitting} className="btn-dark w-full">
              <UserPlus size={17} />
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-highland hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
