import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const TABS = ["Uploads", "Bookmarks", "Notifications"];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Uploads");

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-highland/10 border border-highland flex items-center justify-center font-display text-xl text-highland">
          {user?.fullName?.[0] ?? "?"}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{user?.fullName}</h1>
          <p className="text-sm text-ink/60">
            {user?.email} · {user?.reputation ?? 0} reputation points
            {!user?.isVerified && (
              <span className="ml-2 text-gold">· email not verified</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-line mb-8">
        {TABS.map((t) => (
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

      {tab === "Uploads" && (
        <div className="grid md:grid-cols-2 gap-5">
          {uploads.isLoading && <p className="text-ink/60">Loading…</p>}
          {uploads.data?.length === 0 && <p className="text-ink/50">You haven't uploaded anything yet.</p>}
          {uploads.data?.map((r) => (
            <Link key={r.id} to={`/resources/${r.id}`} className="border border-line rounded-sm p-5 bg-white hover:border-highland transition-colors">
              <p className="course-tab text-xs text-highland mb-2">{r.status}</p>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-ink/40 mt-3">{r.downloadCount} downloads · {r._count?.likes ?? 0} likes</p>
            </Link>
          ))}
        </div>
      )}

      {tab === "Bookmarks" && (
        <div className="grid md:grid-cols-2 gap-5">
          {bookmarks.isLoading && <p className="text-ink/60">Loading…</p>}
          {bookmarks.data?.length === 0 && <p className="text-ink/50">No bookmarks yet.</p>}
          {bookmarks.data?.map((r) => (
            <Link key={r.id} to={`/resources/${r.id}`} className="border border-line rounded-sm p-5 bg-white hover:border-highland transition-colors">
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-ink/60 mt-1">{r.university?.name}</p>
            </Link>
          ))}
        </div>
      )}

      {tab === "Notifications" && (
        <ul className="divide-y divide-line border border-line rounded-sm bg-white">
          {notifications.isLoading && <li className="p-4 text-ink/60">Loading…</li>}
          {notifications.data?.length === 0 && <li className="p-4 text-ink/50">No notifications yet.</li>}
          {notifications.data?.map((n) => (
            <li key={n.id} className={`p-4 text-sm ${n.isRead ? "text-ink/60" : "text-ink font-medium"}`}>
              {n.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
