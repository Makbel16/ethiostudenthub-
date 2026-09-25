import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  FileText,
  Film,
  Globe,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import api from "../api/client.js";
import ModerationResourceCard, {
  getFileTypeDetails,
} from "../components/admin/ModerationResourceCard.jsx";

export default function AdminModeration() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedUniversity, setSelectedUniversity] = useState("ALL");
  const [expandAll, setExpandAll] = useState(false);

  const queue = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => api.get("/resources/moderation/queue").then((r) => r.data),
  });

  const moderate = useMutation({
    mutationFn: ({ id, status, reason }) =>
      api.patch(`/resources/${id}/moderate`, { status, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation-queue"] }),
  });

  const rawItems = queue.data || [];

  // Metrics computation
  const metrics = useMemo(() => {
    let docs = 0;
    let videos = 0;
    let links = 0;
    let images = 0;

    rawItems.forEach((item) => {
      const details = getFileTypeDetails(item);
      if (details.kind === "youtube" || details.kind === "video" || details.kind === "vimeo") {
        videos++;
      } else if (details.kind === "image") {
        images++;
      } else if (details.kind === "link") {
        links++;
      } else {
        docs++;
      }
    });

    return { total: rawItems.length, docs, videos, links, images };
  }, [rawItems]);

  // List of unique universities from pending items
  const universitiesList = useMemo(() => {
    const map = new Map();
    rawItems.forEach((item) => {
      if (item.university?.name) {
        map.set(item.university.name, (map.get(item.university.name) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rawItems]);

  // Filtered pending items
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const details = getFileTypeDetails(item);

      // Type filter
      if (selectedType === "DOCUMENTS" && details.kind !== "document") return false;
      if (
        selectedType === "VIDEOS" &&
        details.kind !== "youtube" &&
        details.kind !== "video" &&
        details.kind !== "vimeo"
      )
        return false;
      if (selectedType === "LINKS" && details.kind !== "link") return false;
      if (selectedType === "IMAGES" && details.kind !== "image") return false;

      // University filter
      if (selectedUniversity !== "ALL" && item.university?.name !== selectedUniversity) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesCode = item.courseCode?.toLowerCase().includes(q);
        const matchesUploader =
          item.uploader?.fullName?.toLowerCase().includes(q) ||
          item.uploader?.email?.toLowerCase().includes(q);
        const matchesUni = item.university?.name?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesUploader && !matchesUni && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [rawItems, selectedType, selectedUniversity, searchQuery]);

  return (
    <div className="page-shell py-8 sm:py-12 space-y-8">
      {/* ========================================================================= */}
      {/* 1. ADVANCED MODERATION COCKPIT HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-line/70 dark:border-dark-border/70 pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} />
            <span>Anti-Malware & Content Moderation Console</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-white">
            Resource Moderation & Safety Center
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted dark:text-dark-muted max-w-2xl leading-relaxed">
            Inspect uploaded documents, videos, and links in a protected sandbox. Verify academic legitimacy before publishing to Ethiopian university students.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setExpandAll((prev) => !prev)}
            className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-2 shadow-sm"
          >
            {expandAll ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{expandAll ? "Collapse All In-App Players" : "Expand All In-App Players"}</span>
          </button>

          <button
            type="button"
            disabled={queue.isFetching}
            onClick={() => queue.refetch()}
            className="btn-secondary text-xs py-2.5 px-3.5 inline-flex items-center gap-1.5"
            title="Refresh Moderation Queue"
          >
            <RefreshCw size={15} className={queue.isFetching ? "animate-spin text-highland" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Pending */}
        <div
          onClick={() => setSelectedType("ALL")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
            selectedType === "ALL"
              ? "border-highland bg-highland/10 shadow-md dark:border-highland dark:bg-highland/20"
              : "border-line bg-surface hover:border-highland/40 dark:border-dark-border dark:bg-dark-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Total Pending
            </span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="font-display text-3xl font-extrabold text-ink dark:text-white mt-2">
            {metrics.total}
          </p>
          <p className="text-[11px] text-muted dark:text-dark-muted mt-1">
            Across all categories
          </p>
        </div>

        {/* Documents & PDFs */}
        <div
          onClick={() => setSelectedType("DOCUMENTS")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
            selectedType === "DOCUMENTS"
              ? "border-highland bg-highland/10 shadow-md dark:border-highland dark:bg-highland/20"
              : "border-line bg-surface hover:border-highland/40 dark:border-dark-border dark:bg-dark-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Documents & PDFs
            </span>
            <FileText size={16} className="text-highland" />
          </div>
          <p className="font-display text-3xl font-extrabold text-ink dark:text-white mt-2">
            {metrics.docs}
          </p>
          <p className="text-[11px] text-muted dark:text-dark-muted mt-1">
            Midterms, finals, notes
          </p>
        </div>

        {/* Videos & YouTube */}
        <div
          onClick={() => setSelectedType("VIDEOS")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
            selectedType === "VIDEOS"
              ? "border-red-500 bg-red-500/10 shadow-md dark:border-red-500 dark:bg-red-500/20"
              : "border-line bg-surface hover:border-red-500/40 dark:border-dark-border dark:bg-dark-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Videos & YouTube
            </span>
            <Film size={16} className="text-red-500" />
          </div>
          <p className="font-display text-3xl font-extrabold text-ink dark:text-white mt-2">
            {metrics.videos}
          </p>
          <p className="text-[11px] text-muted dark:text-dark-muted mt-1">
            In-app embedded preview
          </p>
        </div>

        {/* External Web Links */}
        <div
          onClick={() => setSelectedType("LINKS")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
            selectedType === "LINKS"
              ? "border-blue-500 bg-blue-500/10 shadow-md dark:border-blue-500 dark:bg-blue-500/20"
              : "border-line bg-surface hover:border-blue-500/40 dark:border-dark-border dark:bg-dark-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              External Links
            </span>
            <Globe size={16} className="text-blue-500" />
          </div>
          <p className="font-display text-3xl font-extrabold text-ink dark:text-white mt-2">
            {metrics.links}
          </p>
          <p className="text-[11px] text-muted dark:text-dark-muted mt-1">
            Domain safety check
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & ADVANCED FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-line/80 bg-surface/80 p-4 shadow-sm backdrop-blur-md dark:border-dark-border/80 dark:bg-dark-surface/80 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-dark-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending by title, course code (e.g. CoSc2012), student uploader, university..."
              className="input-field pl-10 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-ink dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* University Filter Dropdown */}
          <div className="sm:w-64 shrink-0">
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="input-field text-sm"
            >
              <option value="ALL">All Universities ({rawItems.length})</option>
              {universitiesList.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/60 dark:border-dark-border/60">
          <span className="text-xs font-semibold text-muted dark:text-dark-muted mr-1 flex items-center gap-1">
            <Filter size={13} /> Filter:
          </span>

          {[
            { id: "ALL", label: `All (${metrics.total})` },
            { id: "DOCUMENTS", label: `Documents (${metrics.docs})` },
            { id: "VIDEOS", label: `Videos & YouTube (${metrics.videos})` },
            { id: "LINKS", label: `Links (${metrics.links})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedType === tab.id
                  ? "bg-highland text-white shadow-md shadow-highland/20"
                  : "border border-line bg-surface text-muted hover:text-ink dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(selectedType !== "ALL" || selectedUniversity !== "ALL" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedType("ALL");
                setSelectedUniversity("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-highland dark:text-emerald-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODERATION QUEUE LIST */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        {queue.isLoading && (
          <div className="py-20 text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-highland border-t-transparent mx-auto" />
            <p className="text-sm font-semibold text-muted dark:text-dark-muted">
              Loading moderation queue...
            </p>
          </div>
        )}

        {!queue.isLoading && filteredItems.length === 0 && (
          <div className="empty-state py-20 text-center rounded-3xl border border-line/80 bg-surface dark:border-dark-border dark:bg-dark-surface shadow-sm">
            {rawItems.length === 0 ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto mb-4 border border-emerald-500/20">
                  <ShieldCheck size={36} />
                </div>
                <h3 className="font-display text-xl font-bold text-ink dark:text-white">
                  All Caught Up! Queue is Clear
                </h3>
                <p className="text-sm text-muted dark:text-dark-muted mt-2 max-w-md mx-auto">
                  Every submitted past exam, lecture note, and video has been reviewed and approved. Great job keeping the hub safe!
                </p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto mb-4 border border-amber-500/20">
                  <Filter size={32} />
                </div>
                <h3 className="font-display text-xl font-bold text-ink dark:text-white">
                  No Items Matching Filters
                </h3>
                <p className="text-sm text-muted dark:text-dark-muted mt-2 max-w-md mx-auto">
                  No pending submissions match your current search query or category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("ALL");
                    setSelectedUniversity("ALL");
                    setSearchQuery("");
                  }}
                  className="btn-secondary text-xs mt-4"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        )}

        {filteredItems.map((resource) => (
          <ModerationResourceCard
            key={resource.id}
            resource={resource}
            onApprove={(id) => moderate.mutate({ id, status: "APPROVED" })}
            onReject={(id, reason) => moderate.mutate({ id, status: "REJECTED", reason })}
            isPending={moderate.isPending}
            forceExpand={expandAll}
          />
        ))}
      </section>
    </div>
  );
}
