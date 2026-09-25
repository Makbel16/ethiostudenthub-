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
      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS (EXECUTIVE DASHBOARD STYLE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Pending Review */}
        <div
          onClick={() => setSelectedType("ALL")}
          className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
            selectedType === "ALL"
              ? "border-amber-500/70 bg-gradient-to-b from-amber-500/15 via-surface to-surface shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30 dark:from-amber-500/20 dark:via-dark-surface dark:to-dark-surface"
              : "border-line/80 bg-surface/90 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-md dark:border-dark-border/80 dark:bg-dark-surface/90"
          }`}
        >
          {/* Accent Glow in background */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors" />

          {/* Top Row: Icon + Status Pill */}
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Clock size={20} />
            </div>
            {selectedType === "ALL" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Active View
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                All Types
              </span>
            )}
          </div>

          {/* Middle Row: Big Counter & Title */}
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Total Queue
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-black text-ink dark:text-white tracking-tight">
                {metrics.total}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Submissions
              </span>
            </div>
          </div>

          {/* Bottom Row: Contextual Helper Description */}
          <p className="mt-3 text-xs text-muted dark:text-dark-muted leading-relaxed border-t border-line/50 dark:border-dark-border/50 pt-2.5">
            Awaiting verification across all departments & universities.
          </p>
        </div>

        {/* Card 2: Academic Documents & PDFs */}
        <div
          onClick={() => setSelectedType("DOCUMENTS")}
          className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
            selectedType === "DOCUMENTS"
              ? "border-emerald-500/70 bg-gradient-to-b from-emerald-500/15 via-surface to-surface shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30 dark:from-emerald-500/20 dark:via-dark-surface dark:to-dark-surface"
              : "border-line/80 bg-surface/90 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-md dark:border-dark-border/80 dark:bg-dark-surface/90"
          }`}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            {selectedType === "DOCUMENTS" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active View
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                PDF & Docs
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Academic Documents
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-black text-ink dark:text-white tracking-tight">
                {metrics.docs}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Exam Papers & Notes
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted dark:text-dark-muted leading-relaxed border-t border-line/50 dark:border-dark-border/50 pt-2.5">
            Verified past midterms, finals, model exams & lecture handouts.
          </p>
        </div>

        {/* Card 3: Video Lectures & Media */}
        <div
          onClick={() => setSelectedType("VIDEOS")}
          className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
            selectedType === "VIDEOS"
              ? "border-rose-500/70 bg-gradient-to-b from-rose-500/15 via-surface to-surface shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/30 dark:from-rose-500/20 dark:via-dark-surface dark:to-dark-surface"
              : "border-line/80 bg-surface/90 hover:border-rose-500/40 hover:-translate-y-1 hover:shadow-md dark:border-dark-border/80 dark:bg-dark-surface/90"
          }`}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <Film size={20} />
            </div>
            {selectedType === "VIDEOS" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Active View
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                YouTube & Streams
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              Video & Media
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-black text-ink dark:text-white tracking-tight">
                {metrics.videos}
              </span>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                In-App Playable
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted dark:text-dark-muted leading-relaxed border-t border-line/50 dark:border-dark-border/50 pt-2.5">
            YouTube, Vimeo, & direct lecture clips streamable directly here.
          </p>
        </div>

        {/* Card 4: External Web Links */}
        <div
          onClick={() => setSelectedType("LINKS")}
          className={`group relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
            selectedType === "LINKS"
              ? "border-blue-500/70 bg-gradient-to-b from-blue-500/15 via-surface to-surface shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30 dark:from-blue-500/20 dark:via-dark-surface dark:to-dark-surface"
              : "border-line/80 bg-surface/90 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-md dark:border-dark-border/80 dark:bg-dark-surface/90"
          }`}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Globe size={20} />
            </div>
            {selectedType === "LINKS" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Active View
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                URL References
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-dark-muted">
              External Portals
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-black text-ink dark:text-white tracking-tight">
                {metrics.links}
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Web Links
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted dark:text-dark-muted leading-relaxed border-t border-line/50 dark:border-dark-border/50 pt-2.5">
            Campus portals, digital libraries & online study tools.
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
