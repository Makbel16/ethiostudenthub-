import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark, Trash2 } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const LEVEL_LABELS = {
  YEAR_1: "Year 1", YEAR_2: "Year 2", YEAR_3: "Year 3", YEAR_4: "Year 4",
  YEAR_5: "Year 5", YEAR_6: "Year 6", MASTERS: "Master's", PHD: "PhD",
};
const SEMESTER_LABELS = { SEMESTER_1: "Semester 1", SEMESTER_2: "Semester 2", SUMMER: "Summer" };

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: resource, isLoading } = useQuery({
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

  if (isLoading) return <p className="max-w-3xl mx-auto px-6 py-12 text-ink/60">Loading…</p>;
  if (!resource) return <p className="max-w-3xl mx-auto px-6 py-12 text-ink/60">Resource not found.</p>;

  const canManage = user && (user.id === resource.uploader?.id || ["ADMIN", "MODERATOR"].includes(user.role));

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <p className="course-tab text-xs text-highland mb-2">{resource.type?.replace("_", " ")}</p>
          <h1 className="font-display text-3xl font-semibold">{resource.title}</h1>
        </div>
        {canManage && (
          <button
            onClick={() => {
              if (confirm(`Delete "${resource.title}"? This can't be undone.`)) deleteResource.mutate();
            }}
            className="flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>

      <p className="text-ink/60 mt-2">
        {resource.university?.name}
        {resource.college?.name && ` · ${resource.college.name}`}
        {resource.department?.name && ` · ${resource.department.name}`}
        {" · "}Uploaded by {resource.uploader?.fullName}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {resource.courseCode && (
          <span className="course-tab text-xs bg-highland/10 text-highland px-2.5 py-1 rounded-sm">
            {resource.courseCode}
          </span>
        )}
        {resource.courseTitle && (
          <span className="text-xs bg-ink/5 text-ink/70 px-2.5 py-1 rounded-sm">{resource.courseTitle}</span>
        )}
        {resource.level && (
          <span className="text-xs bg-ink/5 text-ink/70 px-2.5 py-1 rounded-sm">{LEVEL_LABELS[resource.level]}</span>
        )}
        {resource.semester && (
          <span className="text-xs bg-ink/5 text-ink/70 px-2.5 py-1 rounded-sm">{SEMESTER_LABELS[resource.semester]}</span>
        )}
        {resource.academicYear && (
          <span className="text-xs bg-ink/5 text-ink/70 px-2.5 py-1 rounded-sm">{resource.academicYear}</span>
        )}
        {resource.examType && (
          <span className="text-xs bg-ink/5 text-ink/70 px-2.5 py-1 rounded-sm">{resource.examType}</span>
        )}
      </div>

      {resource.description && <p className="mt-6 text-ink/80">{resource.description}</p>}

      <div className="flex items-center gap-3 mt-8">
        <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/resources/${id}/download`}
          className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-highland transition-colors text-sm"
        >
          Download file
        </a>
        {user && (
          <>
            <button
              onClick={() => like.mutate()}
              className="flex items-center gap-1.5 border border-line px-4 py-2.5 rounded-sm text-sm hover:border-highland"
            >
              <Heart size={16} /> {resource._count?.likes ?? 0}
            </button>
            <button
              onClick={() => bookmark.mutate()}
              className="flex items-center gap-1.5 border border-line px-4 py-2.5 rounded-sm text-sm hover:border-highland"
            >
              <Bookmark size={16} /> Save
            </button>
          </>
        )}
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold mb-4">Comments</h2>

        {user ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (comment.trim()) postComment.mutate(comment.trim());
            }}
            className="flex gap-2 mb-6"
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment"
              className="flex-1 border border-line px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-highland"
            />
            <button className="bg-ink text-paper px-4 py-2 rounded-sm text-sm hover:bg-highland transition-colors">
              Post
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink/50 mb-6">
            <Link to="/login" className="text-highland">Log in</Link> to comment.
          </p>
        )}

        {resource.comments?.length === 0 && <p className="text-ink/50 text-sm">No comments yet.</p>}
        <ul className="space-y-4">
          {resource.comments?.map((c) => (
            <li key={c.id} className="text-sm flex items-start justify-between">
              <span>
                <span className="font-medium">{c.user?.fullName}</span>{" "}
                <span className="text-ink/70">{c.content}</span>
              </span>
              {user && (user.id === c.user?.id || ["ADMIN", "MODERATOR"].includes(user.role)) && (
                <button
                  onClick={() => deleteComment.mutate(c.id)}
                  className="text-xs text-ink/40 hover:text-red-600 ml-4 shrink-0"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}