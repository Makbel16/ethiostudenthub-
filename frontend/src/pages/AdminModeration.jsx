import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import api from "../api/client.js";

export default function AdminModeration() {
  const queryClient = useQueryClient();

  const queue = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => api.get("/resources/moderation/queue").then((r) => r.data),
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/resources/${id}/moderate`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation-queue"] }),
  });

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <ShieldCheck size={16} />
          Moderation
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Resource Moderation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Review and approve or reject submitted resources.
        </p>
      </div>

      <section className="space-y-4">
        {queue.isLoading && <p className="text-sm text-muted">Loading moderation queue...</p>}
        {queue.data?.length === 0 && <div className="empty-state">Nothing pending review.</div>}
        {queue.data?.map((resource) => (
          <div key={resource.id} className="surface-card rounded-xl p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="badge-gold">PENDING</span>
                  <span className="badge">{resource.type?.replaceAll("_", " ")}</span>
                  {resource.university?.name && <span className="badge">{resource.university.name}</span>}
                </div>
                <h2 className="text-xl font-semibold text-ink">{resource.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  Uploaded by {resource.uploader?.fullName} ({resource.uploader?.email})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => moderate.mutate({ id: resource.id, status: "APPROVED" })}
                  className="btn-primary"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={() => moderate.mutate({ id: resource.id, status: "REJECTED" })}
                  className="btn-secondary border-ember/30 text-ember hover:border-ember hover:text-ember"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
