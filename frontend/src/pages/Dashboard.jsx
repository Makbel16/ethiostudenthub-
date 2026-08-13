import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Bookmark, FileText, Trash2, UploadCloud, UserRound } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const TABS = [
  { value: "Uploads", icon: FileText },
  { value: "Bookmarks", icon: Bookmark },
  { value: "Notifications", icon: Bell },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Uploads");
  const queryClient = useQueryClient();

  const uploads = useQuery({
    queryKey: ["me-uploads"],
    queryFn: () => api.get("/users/me/uploads").then((r) => r.data),
    enabled: tab === "Uploads",
  });

  const bookmarks = useQuery({
    queryKey: ["me-bookmarks"],
    queryFn: () => api.get("/users/me/bookmarks").then((r) => r.data),
    enabled: tab === "Bookmarks",
  });

  const notifications = useQuery({
    queryKey: ["me-notifications"],
    queryFn: () => api.get("/users/me/notifications").then((r) => r.data),
    enabled: tab === "Notifications",
  });

  const deleteResource = useMutation({
    mutationFn: (id) => api.delete(`/resources/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me-uploads"] }),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/users/me/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me-notifications"] }),
  });

  const uploadCount = uploads.data?.length ?? user?._count?.resources ?? 0;
  const commentCount = user?._count?.comments ?? 0;
  const unreadCount = notifications.data?.filter((item) => !item.isRead).length ?? 0;

  return (
    <div className="page-shell py-10">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="section-panel rounded-xl p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-highland text-2xl font-semibold text-white shadow-sm">
                {user?.fullName?.[0] ?? <UserRound size={28} />}
              </div>
              <div>
                <p className="eyebrow">Student dashboard</p>
                <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{user?.fullName}</h1>
                <p className="mt-1 text-sm text-muted">{user?.email}</p>
              </div>
            </div>
            <Link to="/upload" className="btn-primary">
              <UploadCloud size={16} />
              Upload material
            </Link>
          </div>

          {!user?.isVerified && (
            <div className="mt-6 rounded-lg border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-ink">
              Your email is not verified. Verification improves account trust and upload confidence.
            </div>
          )}
        </section>

        <section className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          <div className="stat-tile">
            <p className="eyebrow">Uploads</p>
            <p className="mt-2 font-display text-3xl font-semibold">{uploadCount}</p>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Comments</p>
            <p className="mt-2 font-display text-3xl font-semibold">{commentCount}</p>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Reputation</p>
            <p className="mt-2 font-display text-3xl font-semibold">{user?.reputation ?? 0}</p>
          </div>
        </section>
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border border-line bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-highland text-white" : "text-muted hover:bg-mist hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {item.value}
                {item.value === "Notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-xs text-ink">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "Uploads" && (
        <section>
          {uploads.isLoading && <p className="text-sm text-muted">Loading uploads...</p>}
          {uploads.data?.length === 0 && (
            <div className="empty-state">
              You have not uploaded anything yet. <Link to="/upload" className="font-semibold text-highland">Upload your first material.</Link>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uploads.data?.map((resource) => (
              <div key={resource.id} className="surface-card rounded-xl p-5">
                <Link to={`/resources/${resource.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={resource.status === "APPROVED" ? "badge-green" : "badge-gold"}>{resource.status}</span>
                    <span className="text-xs font-semibold text-muted">{resource.downloadCount} downloads</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h2>
                  <p className="mt-3 text-xs font-semibold text-muted">
                    {resource._count?.likes ?? 0} likes - {resource._count?.comments ?? 0} comments
                  </p>
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${resource.title}"? This cannot be undone.`)) deleteResource.mutate(resource.id);
                  }}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ember hover:underline"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "Bookmarks" && (
        <section>
          {bookmarks.isLoading && <p className="text-sm text-muted">Loading bookmarks...</p>}
          {bookmarks.data?.length === 0 && <div className="empty-state">No bookmarks yet. Save resources from the detail page.</div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookmarks.data?.map((resource) => (
              <Link key={resource.id} to={`/resources/${resource.id}`} className="surface-card rounded-xl p-5">
                <span className="badge-green">{resource.type?.replaceAll("_", " ") || "RESOURCE"}</span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h2>
                <p className="mt-2 text-sm text-muted">{resource.university?.name || "General resource"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tab === "Notifications" && (
        <section className="table-shell">
          {notifications.isLoading && <div className="p-4 text-sm text-muted">Loading notifications...</div>}
          {notifications.data?.length === 0 && <div className="p-6 text-sm text-muted">No notifications yet.</div>}
          <ul className="divide-y divide-line">
            {notifications.data?.map((notification) => (
              <li key={notification.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm ${notification.isRead ? "text-muted" : "font-semibold text-ink"}`}>
                    {notification.message}
                  </p>
                  {notification.createdAt && (
                    <p className="mt-1 text-xs text-muted">{new Date(notification.createdAt).toLocaleString()}</p>
                  )}
                </div>
                {!notification.isRead && (
                  <button onClick={() => markRead.mutate(notification.id)} className="btn-secondary self-start">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
