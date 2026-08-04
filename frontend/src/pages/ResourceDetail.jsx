import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client.js";

export default function ResourceDetail() {
  const { id } = useParams();
  const { data: resource, isLoading } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => api.get(`/resources/${id}`).then((r) => r.data),
  });

  if (isLoading) return <p className="max-w-3xl mx-auto px-6 py-12 text-ink/60">Loading…</p>;
  if (!resource) return <p className="max-w-3xl mx-auto px-6 py-12 text-ink/60">Resource not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="course-tab text-xs text-highland mb-2">{resource.type?.replace("_", " ")}</p>
      <h1 className="font-display text-3xl font-semibold">{resource.title}</h1>
      <p className="text-ink/60 mt-2">
        {resource.university?.name} · {resource.department?.name} · Uploaded by {resource.uploader?.fullName}
      </p>

      {resource.description && <p className="mt-6 text-ink/80">{resource.description}</p>}

      <a
        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/resources/${id}/download`}
        className="inline-block mt-8 bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-highland transition-colors text-sm"
      >
        Download file
      </a>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold mb-4">Comments</h2>
        {resource.comments?.length === 0 && <p className="text-ink/50 text-sm">No comments yet.</p>}
        <ul className="space-y-4">
          {resource.comments?.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.user?.fullName}</span>{" "}
              <span className="text-ink/70">{c.content}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
