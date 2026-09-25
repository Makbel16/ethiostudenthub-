import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import api from "../api/client.js";
import ModerationResourceCard from "../components/admin/ModerationResourceCard.jsx";

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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <ShieldCheck size={16} />
          Safety & Verification
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink dark:text-white">
          Resource Moderation Queue
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted dark:text-dark-muted">
          Review submitted files, inspect PDF/video/image attachments to prevent malicious content, and approve or reject submissions.
        </p>
      </div>

      <section className="space-y-4">
        {queue.isLoading && (
          <div className="py-12 text-center text-sm text-muted dark:text-dark-muted">
            Loading moderation queue...
          </div>
        )}

        {queue.data && queue.data.length === 0 && (
          <div className="empty-state py-16 text-center">
            <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="text-base font-semibold text-ink dark:text-white">Queue is clear!</p>
            <p className="text-xs text-muted dark:text-dark-muted mt-1">No pending resources awaiting moderation review.</p>
          </div>
        )}

        {queue.data?.map((resource) => (
          <ModerationResourceCard
            key={resource.id}
            resource={resource}
            onApprove={(id) => moderate.mutate({ id, status: "APPROVED" })}
            onReject={(id) => moderate.mutate({ id, status: "REJECTED" })}
            isPending={moderate.isPending}
          />
        ))}
      </section>
    </div>
  );
}
