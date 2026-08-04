import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client.js";

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["resources", params.toString()],
    queryFn: () => api.get(`/resources?${params.toString()}`).then((r) => r.data),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setParams(q ? { q } : {});
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold mb-6">Browse resources</h1>

      <form onSubmit={onSubmit} className="flex max-w-lg mb-10">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, course, or tag"
          className="flex-1 border border-line bg-white px-4 py-2 text-sm rounded-l-sm focus:outline-none focus:border-highland"
        />
        <button type="submit" className="bg-ink text-paper px-5 rounded-r-sm hover:bg-highland transition-colors text-sm">
          Search
        </button>
      </form>

      {isLoading && <p className="text-ink/60">Loading resources…</p>}
      {isError && (
        <p className="text-ink/60">
          Couldn't reach the API. Make sure the backend is running at the configured VITE_API_URL.
        </p>
      )}

      {data?.items?.length === 0 && (
        <p className="text-ink/60">No resources found. Try a different search.</p>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {data?.items?.map((r) => (
          <Link
            key={r.id}
            to={`/resources/${r.id}`}
            className="border border-line rounded-sm p-5 bg-white hover:border-highland transition-colors"
          >
            <p className="course-tab text-xs text-highland mb-2">{r.type?.replace("_", " ")}</p>
            <p className="font-medium">{r.title}</p>
            <p className="text-sm text-ink/60 mt-1">{r.university?.name || "General"}</p>
            <p className="text-xs text-ink/40 mt-3">
              {r._count?.likes ?? 0} likes · {r._count?.comments ?? 0} comments
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
