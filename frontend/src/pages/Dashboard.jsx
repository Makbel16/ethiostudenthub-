import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  FileText,
  Trash2,
  UploadCloud,
  UserRound,
  TrendingUp,
  Clock,
  Award,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
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
  const reputation = user?.reputation ?? 0;

  const getReputationLevel = (rep) => {
    if (rep >= 1000) return { level: "Expert", color: "text-purple-600", bg: "bg-purple-50" };
    if (rep >= 500) return { level: "Contributor", color: "text-blue-600", bg: "bg-blue-50" };
    if (rep >= 100) return { level: "Member", color: "text-green-600", bg: "bg-green-50" };
    return { level: "Newcomer", color: "text-gray-600", bg: "bg-gray-50" };
  };

  const repLevel = getReputationLevel(reputation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="page-shell py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-highland">
            <Activity size={16} />
            Student Dashboard
          </div>
          <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">
            Welcome back, {user?.fullName?.split(" ")[0] || "Student"}!
          </h1>
          <p className="mt-2 text-muted dark:text-dark-muted">
            Manage your uploads, bookmarks, and stay updated with notifications.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={UploadCloud}
            label="Total Uploads"
            value={uploadCount}
            color="blue"
            trend={uploadCount > 0 ? "+0" : "0"}
          />
          <StatCard
            icon={Bookmark}
            label="Bookmarks"
            value={bookmarks.data?.length ?? 0}
            color="purple"
            trend="Saved"
          />
          <StatCard
            icon={TrendingUp}
            label="Reputation"
            value={reputation}
            color="green"
            trend={repLevel.level}
          />
          <StatCard
            icon={Bell}
            label="Unread"
            value={unreadCount}
            color="amber"
            trend="Notifications"
          />
        </div>

        {/* Verification Banner */}
        {!user?.isVerified && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink dark:text-dark-text">Verify your email</p>
                <p className="mt-1 text-sm text-muted dark:text-dark-muted">
                  Verification improves account trust and upload confidence.
                </p>
              </div>
              <Link to="/verify-email" className="btn-secondary shrink-0">
                Verify now
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left Column - Tabs and Content */}
          <div>
            {/* Tab Navigation */}
            <div className="mb-6 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="flex gap-1">
                {TABS.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setTab(item.value)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                        active
                          ? "bg-highland text-white shadow-md"
                          : "text-muted hover:bg-mist dark:text-dark-muted dark:hover:bg-dark-border"
                      }`}
                    >
                      <Icon size={18} />
                      {item.value}
                      {item.value === "Notifications" && unreadCount > 0 && (
                        <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            {tab === "Uploads" && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Your Uploads</h2>
                  <Link to="/upload" className="inline-flex items-center gap-1 text-sm font-semibold text-highland hover:underline">
                    <UploadCloud size={16} />
                    Upload new
                  </Link>
                </div>
                {uploads.isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-highland border-t-transparent"></div>
                      <p className="text-muted dark:text-dark-muted">Loading uploads...</p>
                    </div>
                  </div>
                )}
                {uploads.data?.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white py-16 dark:border-dark-border dark:bg-dark-surface">
                    <UploadCloud size={48} className="mb-4 text-muted dark:text-dark-muted" />
                    <p className="mb-2 font-semibold text-ink dark:text-dark-text">No uploads yet</p>
                    <p className="mb-4 text-sm text-muted dark:text-dark-muted">
                      Start sharing your academic materials with the community.
                    </p>
                    <Link to="/upload" className="btn-primary">
                      Upload your first material
                    </Link>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {uploads.data?.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} onDelete={() => deleteResource.mutate(resource.id)} />
                  ))}
                </div>
              </section>
            )}

            {tab === "Bookmarks" && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Saved Resources</h2>
                </div>
                {bookmarks.isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-highland border-t-transparent"></div>
                      <p className="text-muted dark:text-dark-muted">Loading bookmarks...</p>
                    </div>
                  </div>
                )}
                {bookmarks.data?.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white py-16 dark:border-dark-border dark:bg-dark-surface">
                    <Bookmark size={48} className="mb-4 text-muted dark:text-dark-muted" />
                    <p className="mb-2 font-semibold text-ink dark:text-dark-text">No bookmarks yet</p>
                    <p className="mb-4 text-sm text-muted dark:text-dark-muted">
                      Save interesting resources to access them later.
                    </p>
                    <Link to="/browse" className="btn-secondary">
                      Browse resources
                    </Link>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookmarks.data?.map((resource) => (
                    <BookmarkCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </section>
            )}

            {tab === "Notifications" && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Notifications</h2>
                  {unreadCount > 0 && (
                    <button className="text-sm font-semibold text-highland hover:underline">Mark all as read</button>
                  )}
                </div>
                {notifications.isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-highland border-t-transparent"></div>
                      <p className="text-muted dark:text-dark-muted">Loading notifications...</p>
                    </div>
                  </div>
                )}
                {notifications.data?.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white py-16 dark:border-dark-border dark:bg-dark-surface">
                    <Bell size={48} className="mb-4 text-muted dark:text-dark-muted" />
                    <p className="mb-2 font-semibold text-ink dark:text-dark-text">No notifications</p>
                    <p className="text-sm text-muted dark:text-dark-muted">
                      You're all caught up!
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {notifications.data?.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => markRead.mutate(notification.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Profile Card */}
          <aside className="space-y-6">
            <ProfileCard user={user} reputation={reputation} repLevel={repLevel} />
            <QuickActions />
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }) {
  const colorClasses = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", darkBg: "dark:bg-blue-900/20", darkIcon: "dark:text-blue-400", gradient: "from-blue-500/20 to-blue-600/20" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", darkBg: "dark:bg-purple-900/20", darkIcon: "dark:text-purple-400", gradient: "from-purple-500/20 to-purple-600/20" },
    green: { bg: "bg-green-50", icon: "text-green-600", darkBg: "dark:bg-green-900/20", darkIcon: "dark:text-green-400", gradient: "from-green-500/20 to-green-600/20" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", darkBg: "dark:bg-amber-900/20", darkIcon: "dark:text-amber-400", gradient: "from-amber-500/20 to-amber-600/20" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 dark:border-dark-border dark:bg-dark-surface">
      {/* 3D gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
      
      {/* Animated background pattern */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-current/5 to-current/10 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.darkBg} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
            <Icon size={28} className={`relative z-10 ${colors.icon} ${colors.darkIcon} transition-transform duration-500 group-hover:scale-110`} />
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-50`} />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">{label}</p>
            <p className="mt-1 font-display text-4xl font-bold text-ink dark:text-dark-text transition-transform duration-500 group-hover:scale-110">{value}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-semibold text-highland transition-all duration-500 group-hover:translate-x-1">{trend}</span>
          <span className="text-muted dark:text-dark-muted">Updated now</span>
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function ResourceCard({ resource, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 dark:border-dark-border dark:bg-dark-surface">
      {/* 3D gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-highland/10 to-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Animated background pattern */}
      <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br from-highland/5 to-blue-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <Link to={`/resources/${resource.id}`} className="block">
          <div className="mb-4 flex items-start justify-between gap-2">
            <span className={`transform transition-all duration-500 group-hover:scale-110 ${resource.status === "APPROVED" ? "badge-green" : "badge-gold"}`}>
              {resource.status}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-muted dark:text-dark-muted transition-all duration-500 group-hover:translate-x-1">
              <Clock size={12} />
              {resource.downloadCount}
            </span>
          </div>
          <h3 className="line-clamp-2 text-lg font-semibold text-ink dark:text-dark-text group-hover:text-highland transition-colors duration-500">
            {resource.title}
          </h3>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted dark:text-dark-muted">
            <span className="flex items-center gap-1 transition-all duration-500 group-hover:translate-x-1">
              <TrendingUp size={12} />
              {resource._count?.likes ?? 0} likes
            </span>
            <span className="flex items-center gap-1 transition-all duration-500 group-hover:translate-x-1">
              <FileText size={12} />
              {resource._count?.comments ?? 0} comments
            </span>
          </div>
        </Link>
        <button
          onClick={() => {
            if (confirm(`Delete "${resource.title}"? This cannot be undone.`)) onDelete();
          }}
          className="mt-5 w-full rounded-xl border border-ember/30 py-2.5 text-xs font-semibold text-amber-600 transition-all duration-500 hover:bg-amber-50 hover:scale-105 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
        >
          <Trash2 size={14} className="mr-1 inline transition-transform duration-500 group-hover:rotate-12" />
          Delete
        </button>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function BookmarkCard({ resource }) {
  return (
    <Link to={`/resources/${resource.id}`} className="group relative overflow-hidden block rounded-2xl border border-line bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 dark:border-dark-border dark:bg-dark-surface">
      {/* 3D gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Animated background pattern */}
      <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <span className={`transform transition-all duration-500 group-hover:scale-110 badge-green`}>
          {resource.type?.replaceAll("_", " ") || "RESOURCE"}
        </span>
        <h3 className="mt-5 line-clamp-2 text-lg font-semibold text-ink dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-500">
          {resource.title}
        </h3>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted dark:text-dark-muted transition-all duration-500 group-hover:translate-x-1">
          <Building2 size={12} />
          {resource.university?.name || "General resource"}
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </Link>
  );
}

function NotificationCard({ notification, onMarkRead }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 ${
      notification.isRead
        ? "border-line bg-white dark:border-dark-border dark:bg-dark-surface"
        : "border-highland/30 bg-highland/5 dark:border-highland/40 dark:bg-highland/10"
    }`}>
      {/* 3D gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-highland/10 to-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Animated background pattern */}
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-highland/5 to-blue-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <div className="flex gap-4">
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
            notification.isRead
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              : "bg-highland text-white"
          }`}>
            <Bell size={20} />
            {!notification.isRead && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gold animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm leading-relaxed transition-colors duration-500 ${
              notification.isRead ? "text-muted dark:text-dark-muted" : "font-semibold text-ink dark:text-dark-text"
            }`}>
              {notification.message}
            </p>
            {notification.createdAt && (
              <p className="mt-2 text-xs text-muted dark:text-dark-muted transition-all duration-500 group-hover:translate-x-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {!notification.isRead && (
          <button
            onClick={onMarkRead}
            className="mt-4 w-full rounded-xl bg-highland py-2.5 text-sm font-semibold text-white transition-all duration-500 hover:bg-highland/90 hover:scale-105"
          >
            Mark as read
          </button>
        )}
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function ProfileCard({ user, reputation, repLevel }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 dark:border-dark-border dark:bg-dark-surface">
      {/* 3D gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-highland/10 to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Animated background pattern */}
      <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br from-highland/5 to-purple-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-highland to-highland-dark text-2xl font-bold text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
            {user?.fullName?.[0] ?? <UserRound size={32} />}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-dark-text transition-all duration-500 group-hover:translate-x-1">{user?.fullName}</h3>
            <p className="text-sm text-muted dark:text-dark-muted">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-all duration-500 hover:bg-gray-100 dark:bg-dark-border dark:hover:bg-dark-surface">
            <span className="text-sm text-muted dark:text-dark-muted">Reputation</span>
            <span className="font-display text-lg font-bold text-ink dark:text-dark-text transition-all duration-500 group-hover:scale-110">{reputation}</span>
          </div>
          <div className={`flex items-center justify-between rounded-xl p-3 transition-all duration-500 hover:opacity-80 ${repLevel.bg} dark:bg-opacity-20`}>
            <span className="text-sm text-muted dark:text-dark-muted">Level</span>
            <span className={`text-sm font-semibold ${repLevel.color} transition-all duration-500 group-hover:scale-110`}>{repLevel.level}</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-line dark:border-dark-border">
          <Link to="/settings" className="btn-secondary w-full transition-all duration-500 hover:scale-105">
            <UserRound size={16} />
            Edit Profile
          </Link>
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function QuickActions() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 dark:border-dark-border dark:bg-dark-surface">
      {/* 3D gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Animated background pattern */}
      <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
      
      <div className="relative">
        <h3 className="font-display text-lg font-semibold text-ink dark:text-dark-text mb-5 transition-all duration-500 group-hover:translate-x-1">Quick Actions</h3>
        <div className="space-y-2">
          <Link to="/upload" className="group/action flex items-center justify-between rounded-xl p-4 transition-all duration-500 hover:bg-mist hover:scale-105 hover:translate-x-1 dark:hover:bg-dark-border">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-md transition-all duration-500 group-hover/action:scale-110 group-hover/action:rotate-6 dark:bg-blue-900/20 dark:text-blue-400">
                <UploadCloud size={18} />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/action:opacity-100" />
              </div>
              <span className="font-medium text-ink dark:text-dark-text transition-colors duration-500 group-hover/action:text-blue-600">Upload Material</span>
            </div>
            <ArrowRight size={16} className="text-muted dark:text-dark-muted transition-all duration-500 group-hover/action:translate-x-1 group-hover/action:text-blue-600" />
          </Link>
          <Link to="/browse" className="group/action flex items-center justify-between rounded-xl p-4 transition-all duration-500 hover:bg-mist hover:scale-105 hover:translate-x-1 dark:hover:bg-dark-border">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shadow-md transition-all duration-500 group-hover/action:scale-110 group-hover/action:rotate-6 dark:bg-purple-900/20 dark:text-purple-400">
                <FileText size={18} />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/action:opacity-100" />
              </div>
              <span className="font-medium text-ink dark:text-dark-text transition-colors duration-500 group-hover/action:text-purple-600">Browse Resources</span>
            </div>
            <ArrowRight size={16} className="text-muted dark:text-dark-muted transition-all duration-500 group-hover/action:translate-x-1 group-hover/action:text-purple-600" />
          </Link>
          <Link to="/universities" className="group/action flex items-center justify-between rounded-xl p-4 transition-all duration-500 hover:bg-mist hover:scale-105 hover:translate-x-1 dark:hover:bg-dark-border">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 shadow-md transition-all duration-500 group-hover/action:scale-110 group-hover/action:rotate-6 dark:bg-green-900/20 dark:text-green-400">
                <Award size={18} />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-green-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/action:opacity-100" />
              </div>
              <span className="font-medium text-ink dark:text-dark-text transition-colors duration-500 group-hover/action:text-green-600">University Directory</span>
            </div>
            <ArrowRight size={16} className="text-muted dark:text-dark-muted transition-all duration-500 group-hover/action:translate-x-1 group-hover/action:text-green-600" />
          </Link>
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}
