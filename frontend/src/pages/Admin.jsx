import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client.js";

export default function Admin() {
  const [tab, setTab] = useState("Moderation");
  const queryClient = useQueryClient();

  const queue = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => api.get("/resources/moderation/queue").then((r) => r.data),
    enabled: tab === "Moderation",
  });

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/users").then((r) => r.data),
    enabled: tab === "Users",
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/resources/${id}/moderate`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation-queue"] }),
  });

  const banUser = useMutation({
    mutationFn: ({ id, banned }) => api.patch(`/users/${id}/ban`, { banned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold mb-8">Admin</h1>

      <div className="flex gap-6 border-b border-line mb-8">
        {["Moderation", "Users"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium course-tab ${
              tab === t ? "text-highland border-b-2 border-highland" : "text-ink/50"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "Moderation" && (
        <div className="space-y-4">
          {queue.isLoading && <p className="text-ink/60">Loading…</p>}
          {queue.data?.length === 0 && <p className="text-ink/50">Nothing pending review.</p>}
          {queue.data?.map((r) => (
            <div key={r.id} className="border border-line rounded-sm p-5 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-ink/60">
                  {r.type} · uploaded by {r.uploader?.fullName} ({r.uploader?.email})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moderate.mutate({ id: r.id, status: "APPROVED" })}
                  className="text-sm bg-highland text-paper px-3 py-1.5 rounded-sm hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  onClick={() => moderate.mutate({ id: r.id, status: "REJECTED" })}
                  className="text-sm border border-line px-3 py-1.5 rounded-sm hover:border-red-500 hover:text-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Users" && (
        <table className="w-full text-sm border border-line rounded-sm overflow-hidden bg-white">
          <thead className="bg-ink/5 course-tab text-xs text-ink/60">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.data?.items?.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.fullName}</td>
                <td className="p-3 text-ink/60">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.isBanned ? "Banned" : "Active"}</td>
                <td className="p-3">
                  <button
                    onClick={() => banUser.mutate({ id: u.id, banned: !u.isBanned })}
                    className="text-xs border border-line px-2 py-1 rounded-sm hover:border-highland"
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
