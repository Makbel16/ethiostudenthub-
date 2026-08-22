import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UsersRound } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY_MANAGER_FORM = {
  fullName: "",
  email: "",
  password: "",
  universityId: "",
};

const getErrorMessage = (err, fallback) => {
  const error = err.response?.data?.error;
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.formErrors?.length) return error.formErrors.join(", ");
  if (error.fieldErrors) {
    return Object.entries(error.fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ");
  }
  return fallback;
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [managerForm, setManagerForm] = useState(EMPTY_MANAGER_FORM);
  const [managerError, setManagerError] = useState("");

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const universities = useQuery({
    queryKey: ["admin-universities"],
    queryFn: () => api.get("/universities", { params: { pageSize: 100 } }).then((r) => r.data),
  });

  const universityItems = universities.data?.items ?? [];

  const banUser = useMutation({
    mutationFn: ({ id, banned }) => api.patch(`/users/${id}/ban`, { banned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const createManager = useMutation({
    mutationFn: (form) => api.post("/users/university-managers", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setManagerForm(EMPTY_MANAGER_FORM);
      setManagerError("");
    },
    onError: (err) => setManagerError(getErrorMessage(err, "Could not create university manager")),
  });

  const onManagerSubmit = (e) => {
    e.preventDefault();
    setManagerError("");
    createManager.mutate(managerForm);
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">Access denied. Admin role required.</div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <UsersRound size={16} />
          User Management
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Manage Users</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          View all users, manage account status, and create university manager accounts.
        </p>
      </div>

      <section className="space-y-6">
        <form onSubmit={onManagerSubmit} className="section-panel rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Create University Manager</h2>
            <p className="mt-1 text-sm text-muted">Managers can publish official calendar information and announcements for one university.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <label className="field-label">Full name *</label>
              <input
                value={managerForm.fullName}
                onChange={(e) => setManagerForm((form) => ({ ...form, fullName: e.target.value }))}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input
                type="email"
                value={managerForm.email}
                onChange={(e) => setManagerForm((form) => ({ ...form, email: e.target.value }))}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Temporary password *</label>
              <input
                type="password"
                value={managerForm.password}
                onChange={(e) => setManagerForm((form) => ({ ...form, password: e.target.value }))}
                minLength={8}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">University *</label>
              <select
                value={managerForm.universityId}
                onChange={(e) => setManagerForm((form) => ({ ...form, universityId: e.target.value }))}
                required
                className="select-field"
              >
                <option value="">Select university</option>
                {universityItems.filter((university) => university.isActive !== false).map((university) => (
                  <option key={university.id} value={university.id}>{university.name}</option>
                ))}
              </select>
            </div>
          </div>
          {managerError && (
            <div className="mt-4 rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
              {managerError}
            </div>
          )}
          <button disabled={createManager.isPending} className="btn-dark mt-5">
            {createManager.isPending ? "Creating..." : "Create manager account"}
          </button>
        </form>

        <div className="table-shell">
          {users.isLoading && <div className="p-4 text-sm text-muted">Loading users...</div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-mist text-xs uppercase text-muted">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">University</th>
                  <th className="p-4 text-left">Verification</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data?.items?.map((user) => (
                  <tr key={user.id}>
                    <td className="p-4 font-semibold text-ink">{user.fullName}</td>
                    <td className="p-4 text-muted">{user.email}</td>
                    <td className="p-4"><span className="badge">{user.role}</span></td>
                    <td className="p-4 text-muted">{user.university?.name || "-"}</td>
                    <td className="p-4">{user.isVerified ? <span className="badge-green">Verified</span> : <span className="badge-gold">Unverified</span>}</td>
                    <td className="p-4">{user.isBanned ? <span className="badge-gold">Banned</span> : <span className="badge-green">Active</span>}</td>
                    <td className="p-4">
                      <button
                        onClick={() => banUser.mutate({ id: user.id, banned: !user.isBanned })}
                        className="btn-secondary min-h-9 px-3 py-1.5"
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
