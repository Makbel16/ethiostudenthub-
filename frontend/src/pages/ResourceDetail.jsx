import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  BookOpen,
  Building2,
  CalendarDays,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const LEVEL_LABELS = {
  YEAR_1: "Year 1",
  YEAR_2: "Year 2",
  YEAR_3: "Year 3",
  YEAR_4: "Year 4",
  YEAR_5: "Year 5",
  YEAR_6: "Year 6",
  MASTERS: "Master's",
  PHD: "PhD",
};

const SEMESTER_LABELS = {
  SEMESTER_1: "Semester 1",
  SEMESTER_2: "Semester 2",
  SUMMER: "Summer",
};

const typeLabel = (type) => type?.replaceAll("_", " ") || "RESOURCE";

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const {
    data: resource,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => api.get(`/resources/${id}`).then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resource", id] });

  const like = useMutation({
    mutationFn: () => api.post(`/resources/${id}/like`),
    onSuccess: invalidate,
  });

  const bookmark = useMutation({
    mutationFn: () => api.post(`/resources/${id}/bookmark`),
    onSuccess: invalidate,
  });

  const postComment = useMutation({
    mutationFn: (content) => api.post(`/resources/${id}/comments`, { content }),
    onSuccess: () => {
      setComment("");
      invalidate();
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId) => api.delete(`/resources/${id}/comments/${commentId}`),
    onSuccess: invalidate,
  });

  const deleteResource = useMutation({
    mutationFn: () => api.delete(`/resources/${id}`),
    onSuccess: () => navigate("/browse"),
  });

  if (isLoading) return <p className="page-shell py-12 text-sm text-muted">Loading resource...</p>;
  if (isError || !resource) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">Resource not found or unavailable.</div>
      </div>
    );
  }

  const canManage = user && (user.id === resource.uploader?.id || ["ADMIN", "MODERATOR"].includes(user.role));
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const metaItems = [
    resource.university?.name && { icon: Building2, label: "University", value: resource.university.name },
    resource.department?.name && { icon: Building2, label: "Department", value: resource.department.name },
    resource.courseCode && { icon: BookMetaIcon, label: "Course code", value: resource.courseCode },
    resource.level && { icon: CalendarDays, label: "Level", value: LEVEL_LABELS[resource.level] || resource.level },
    resource.semester && { icon: CalendarDays, label: "Semester", value: SEMESTER_LABELS[resource.semester] || resource.semester },
    resource.academicYear && { icon: CalendarDays, label: "Academic year", value: resource.academicYear },
  ].filter(Boolean);

  return (
    <div className="page-shell py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="section-panel rounded-xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge-green">{typeLabel(resource.type)}</span>
                {resource.status && resource.status !== "APPROVED" && <span className="badge-gold">{resource.status}</span>}
                {resource.examType && <span className="badge">{resource.examType}</span>}
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{resource.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                <UserRound size={16} />
                Uploaded by {resource.uploader?.fullName || "Student contributor"}
                {resource.college?.name && <span>- {resource.college.name}</span>}
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${resource.title}"? This cannot be undone.`)) deleteResource.mutate();
                }}
                className="btn-secondary border-ember/30 text-ember hover:border-ember hover:text-ember"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>

          {resource.description && (
            <p className="mt-8 rounded-lg border border-line bg-paper p-5 text-sm leading-7 text-ink/80">
              {resource.description}
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metaItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.label}-${item.value}`} className="rounded-lg border border-line bg-white p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                    <Icon size={15} className="text-highland" />
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                </div>
              );
            })}
          </div>

          {resource.tags?.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Tag size={16} className="text-highland" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <section className="mt-10 border-t border-line pt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Discussion</h2>
                <p className="mt-1 text-sm text-muted">Ask for context, corrections, or missing details.</p>
              </div>
              <span className="badge">{resource.comments?.length ?? 0} comments</span>
            </div>

            {user ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (comment.trim()) postComment.mutate(comment.trim());
                }}
                className="mb-6 rounded-lg border border-line bg-paper p-3"
              >
                <label className="sr-only" htmlFor="comment">Add a comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a helpful comment"
                  rows={3}
                  className="input-field resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button disabled={postComment.isPending} className="btn-primary">
                    <MessageCircle size={16} />
                    Post comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-lg border border-line bg-paper p-4 text-sm text-muted">
                <Link to="/login" className="font-semibold text-highland">Log in</Link> to comment, like, or bookmark this resource.
              </div>
            )}

            {resource.comments?.length === 0 && <div className="empty-state">No comments yet.</div>}
            <ul className="space-y-3">
              {resource.comments?.map((c) => (
                <li key={c.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{c.user?.fullName || "Student"}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{c.content}</p>
                    </div>
                    {user && (user.id === c.user?.id || ["ADMIN", "MODERATOR"].includes(user.role)) && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="text-xs font-semibold text-ember hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="section-panel rounded-xl p-5">
            <a href={`${apiBase}/resources/${id}/download`} className="btn-dark w-full">
              <Download size={18} />
              Download file
            </a>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button disabled={!user || like.isPending} onClick={() => like.mutate()} className="btn-secondary">
                <Heart size={16} />
                {resource._count?.likes ?? 0}
              </button>
              <button disabled={!user || bookmark.isPending} onClick={() => bookmark.mutate()} className="btn-secondary">
                <Bookmark size={16} />
                Save
              </button>
            </div>
            {!user && <p className="mt-3 text-center text-xs text-muted">Log in to like or save resources.</p>}
          </div>

          <div className="section-panel rounded-xl p-5">
            <p className="font-semibold text-ink">Resource activity</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted"><Download size={15} /> Downloads</dt>
                <dd className="font-semibold text-ink">{resource.downloadCount ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted"><Eye size={15} /> Views</dt>
                <dd className="font-semibold text-ink">{resource.viewCount ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted"><Bookmark size={15} /> Bookmarks</dt>
                <dd className="font-semibold text-ink">{resource._count?.bookmarks ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-highland/20 bg-highland-light p-5">
            <p className="font-semibold text-highland-dark">Keep the library useful</p>
            <p className="mt-2 text-sm leading-6 text-highland-dark/75">
              Download only what you need, add context in comments, and upload better copies when you have them.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BookMetaIcon(props) {
  return <BookOpen {...props} />;
}
