import { useState } from "react";
import { Bell, Check, Trash2, Clock, BookOpen, Award, Briefcase, Calendar } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "resource",
      title: "New Resource Available",
      message: "Advanced Calculus lecture notes have been uploaded to Mathematics department.",
      timestamp: "2024-01-15T10:30:00",
      read: false,
    },
    {
      id: 2,
      type: "scholarship",
      title: "Scholarship Deadline Approaching",
      message: "Ethiopian Government Scholarship application deadline is in 7 days.",
      timestamp: "2024-01-14T14:20:00",
      read: false,
    },
    {
      id: 3,
      type: "job",
      title: "New Internship Opportunity",
      message: "Software Developer Intern position available at EthioTech Solutions.",
      timestamp: "2024-01-13T09:15:00",
      read: true,
    },
    {
      id: 4,
      type: "academic",
      title: "Study Reminder",
      message: "Don't forget to complete your Mathematics assignment due tomorrow.",
      timestamp: "2024-01-12T16:45:00",
      read: true,
    },
    {
      id: 5,
      type: "resource",
      title: "Resource Approved",
      message: "Your uploaded resource 'Physics Lab Report' has been approved.",
      timestamp: "2024-01-11T11:00:00",
      read: true,
    },
  ]);

  const [filter, setFilter] = useState("all");

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "resource":
        return <BookOpen size={20} className="text-highland" />;
      case "scholarship":
        return <Award size={20} className="text-amber-600" />;
      case "job":
        return <Briefcase size={20} className="text-green-600" />;
      case "academic":
        return <Calendar size={20} className="text-blue-600" />;
      default:
        return <Bell size={20} className="text-muted" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "resource":
        return "bg-highland/10 border-highland/20";
      case "scholarship":
        return "bg-amber-50 border-amber-200";
      case "job":
        return "bg-green-50 border-green-200";
      case "academic":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-mist border-line";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    if (filter === "read") return notif.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <Bell size={16} />
          Student Resources
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Notifications</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Stay updated with important announcements, deadlines, and opportunities.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold text-ink">{notifications.length}</span>
                <span className="text-sm text-muted"> total</span>
              </div>
              <div className="h-8 w-px bg-line" />
              <div>
                <span className="text-2xl font-bold text-highland">{unreadCount}</span>
                <span className="text-sm text-muted"> unread</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="select-field"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn-secondary">
                  <Check size={16} />
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="btn-ghost border-ember/30 text-ember hover:border-ember hover:text-ember">
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state py-12">
              {filter === "unread" ? "No unread notifications." : "No notifications."}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`section-panel rounded-xl p-5 transition-colors ${
                  !notification.read
                    ? "border-highland/30 bg-highland/5"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${getTypeColor(
                      notification.type
                    )}`}
                  >
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            !notification.read ? "text-ink" : "text-muted"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="btn-ghost shrink-0"
                          title="Mark as read"
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Clock size={14} />
                        {formatTimestamp(notification.timestamp)}
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="btn-ghost border-ember/30 text-ember hover:border-ember hover:text-ember"
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="section-panel rounded-xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Notification Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                <input type="checkbox" defaultChecked />
                Email notifications for new resources
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                <input type="checkbox" defaultChecked />
                Scholarship deadline reminders
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                <input type="checkbox" defaultChecked />
                Job and internship alerts
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                <input type="checkbox" defaultChecked />
                Study reminders and academic updates
              </label>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
