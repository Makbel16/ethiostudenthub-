import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
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
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold mb-8">Join EthioStudentHub</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input {...register("fullName")} className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
          {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input {...register("email")} className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" {...register("password")} className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
          {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="text-red-600 text-sm">{errors.root.message}</p>}
        <button disabled={isSubmitting} className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-highland transition-colors disabled:opacity-60">
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
