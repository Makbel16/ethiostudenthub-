import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  ExternalLink,
  Download,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Film,
  Image as ImageIcon,
  Building2,
  Calendar,
  Globe,
  Play,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
  Layers,
} from "lucide-react";
import api from "../../api/client.js";

const normalizeYouTubeId = (value) => {
  const id = String(value || "").trim();
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
};

const getYouTubeVideoId = (value = "") => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") {
      return normalizeYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) return null;
    if (url.pathname === "/watch") return normalizeYouTubeId(url.searchParams.get("v"));

    const [section, id] = url.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "v"].includes(section)) return normalizeYouTubeId(id);
  } catch {
    return null;
  }
  return null;
};

const getVimeoVideoId = (value = "") => {
  try {
    const url = new URL(value);
    if (url.hostname.includes("vimeo.com")) {
      const match = url.pathname.match(/\/(\d+)/);
      return match ? match[1] : null;
    }
  } catch {
    return null;
  }
  return null;
};

const getFileExtension = (fileUrl = "") => {
  try {
    const pathname = decodeURIComponent(new URL(fileUrl).pathname);
    const ext = pathname.includes(".") ? pathname.slice(pathname.lastIndexOf(".")).toLowerCase() : "";
    return ext.length <= 12 ? ext : "";
  } catch {
    const cleanUrl = fileUrl.split(/[?#]/)[0];
    return cleanUrl.includes(".") ? cleanUrl.slice(cleanUrl.lastIndexOf(".")).toLowerCase() : "";
  }
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name[0] || "U").toUpperCase();
};

const formatAcademicType = (type = "") => {
  const map = {
    PREVIOUS_EXAM: "Past Exam Paper",
    MODEL_EXAM: "Model Practice Exam",
    LECTURE_NOTE: "Lecture Handout",
    BOOK: "Textbook / Reference",
    ASSIGNMENT: "Course Assignment",
    LAB_MANUAL: "Lab Manual & Guide",
    RESEARCH_PAPER: "Research Paper",
    CHEAT_SHEET: "Quick Summary Sheet",
    VIDEO: "Video Lecture",
    USEFUL_LINK: "Curated Web Resource",
    OTHER: "Academic Material",
  };
  return map[type] || type.replaceAll("_", " ");
};

export const getFileTypeDetails = (resource) => {
  const rawUrl = resource.fileUrl || resource.usefulLinkUrl || "";
  const ext = getFileExtension(rawUrl);
  const ytId = getYouTubeVideoId(rawUrl);
  const vimeoId = getVimeoVideoId(rawUrl);

  if (ytId) {
    return {
      kind: "youtube",
      label: "YouTube Video",
      badgeText: "YouTube Video",
      icon: Film,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      videoId: ytId,
      isExternalVideo: true,
      accentColor: "from-red-500 via-rose-500 to-amber-500",
      color: "text-red-500 bg-red-500/10 border-red-500/30 dark:bg-red-500/20",
    };
  }

  if (vimeoId) {
    return {
      kind: "vimeo",
      label: "Vimeo Video",
      badgeText: "Vimeo Video",
      icon: Film,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      thumbnailUrl: null,
      videoId: vimeoId,
      isExternalVideo: true,
      accentColor: "from-sky-500 via-blue-500 to-indigo-500",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/30 dark:bg-sky-500/20",
    };
  }

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return {
      kind: "image",
      label: `Image Document (${ext.slice(1).toUpperCase()})`,
      badgeText: `Image (${ext.slice(1).toUpperCase()})`,
      icon: ImageIcon,
      accentColor: "from-amber-500 via-orange-500 to-yellow-500",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/20",
    };
  }

  if (ext === ".mp4" || ext === ".webm" || ext === ".mov" || resource.type === "VIDEO") {
    return {
      kind: "video",
      label: "Direct Video Stream",
      badgeText: "MP4 / WebM Video",
      icon: Film,
      accentColor: "from-purple-500 via-fuchsia-500 to-pink-500",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/30 dark:bg-purple-500/20",
    };
  }

  if (resource.type === "USEFUL_LINK") {
    return {
      kind: "link",
      label: "External Academic Link",
      badgeText: "External Link",
      icon: Globe,
      accentColor: "from-cyan-500 via-teal-500 to-emerald-500",
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30 dark:bg-cyan-500/20",
    };
  }

  return {
    kind: "document",
    label: ext ? `PDF Document (${ext.slice(1).toUpperCase()})` : "Academic PDF Paper",
    badgeText: "PDF Document",
    icon: FileText,
    accentColor: "from-emerald-500 via-teal-500 to-cyan-500",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/20",
  };
};

export default function ModerationResourceCard({
  resource,
  onApprove,
  onReject,
  isPending,
  forceExpand = null,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [showRejectMenu, setShowRejectMenu] = useState(false);
  const blobUrlRef = useRef(null);

  const fileDetails = getFileTypeDetails(resource);
  const IconComponent = fileDetails.icon;
  const isVideo = fileDetails.isExternalVideo || fileDetails.kind === "video";
  const isAdmin = resource.uploader?.role === "ADMIN";

  // Format academic type cleanly (avoid redundant "Curated Web Resource" when already marked as YouTube)
  const displayAcademicType =
    isVideo && (resource.type === "USEFUL_LINK" || resource.type === "VIDEO")
      ? "Interactive Video Course"
      : formatAcademicType(resource.type);

  // Sync with parent forceExpand toggle if provided
  useEffect(() => {
    if (forceExpand !== null) {
      if (forceExpand) {
        loadPreview();
      } else {
        setShowPreview(false);
      }
    }
  }, [forceExpand]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const loadPreview = async () => {
    // External video doesn't need blob fetching
    if (fileDetails.isExternalVideo) {
      setPreviewData({
        url: fileDetails.embedUrl,
        kind: fileDetails.kind,
        isExternalVideo: true,
      });
      setShowPreview(true);
      return;
    }

    if (fileDetails.kind === "link") {
      setPreviewData({ url: resource.fileUrl || resource.usefulLinkUrl, kind: "link" });
      setShowPreview(true);
      return;
    }

    if (previewData) {
      setShowPreview(true);
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");
    setShowPreview(true);

    try {
      const response = await api.get(`/resources/${resource.id}/open`, { responseType: "blob" });
      const contentType = response.headers?.["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = objectUrl;

      setPreviewData({
        url: objectUrl,
        contentType,
        isImage: contentType.startsWith("image/"),
        isPdf: contentType.includes("pdf"),
        kind: contentType.startsWith("image/") ? "image" : fileDetails.kind,
      });
    } catch (err) {
      console.error("Moderation file preview error:", err);
      setPreviewError(
        err.response?.data?.error ||
          "Unable to stream file directly. Click 'Raw Source URL' to inspect the uploaded asset."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTogglePreview = () => {
    if (showPreview) {
      setShowPreview(false);
    } else {
      loadPreview();
    }
  };

  const handleDirectDownload = async () => {
    try {
      const response = await api.get(`/resources/${resource.id}/download`, { responseType: "blob" });
      const contentType = response.headers?.["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${resource.title || "resource"}${getFileExtension(resource.fileUrl) || ".pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      alert("Download failed: " + (err.response?.data?.error || err.message));
    }
  };

  const REJECT_REASONS = [
    "Malicious, Phishing, or Executable file",
    "Spam, Commercial Ad, or Irrelevant",
    "Copyright Infringement / DMCA",
    "Wrong University, Department, or Course Code",
    "Corrupted, Unreadable, or Blank File",
  ];

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-line/80 bg-gradient-to-b from-surface via-surface to-surface/95 dark:from-dark-surface dark:via-dark-surface dark:to-dark-surface/95 dark:border-dark-border p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-highland/40 dark:hover:border-emerald-500/40 transition-all duration-300">
      {/* Decorative top accent line */}
      <div
        className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${fileDetails.accentColor || "from-amber-500 via-highland to-emerald-500"} opacity-90`}
      />

      {/* ========================================================================= */}
      {/* 1. TOP STATUS & CLASSIFICATION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 dark:border-dark-border/60 pb-4">
        {/* Left side: Safety Status + Media Badge + Academic Type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pulsing Safety Status Pill */}
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            PENDING SAFETY REVIEW
          </span>

          {/* Media Format Pill (YouTube Video, PDF Document, etc.) */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${fileDetails.color}`}
          >
            <IconComponent size={14} />
            <span>{fileDetails.badgeText}</span>
          </span>

          {/* Academic Type (e.g. Interactive Video Course, Past Exam Paper) */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink/80 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text shadow-sm">
            <BookOpen size={13} className="text-highland" />
            <span>{displayAcademicType}</span>
          </span>
        </div>

        {/* Right side: University & Course Code Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {resource.courseCode && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-highland/10 px-2.5 py-1 font-mono text-xs font-extrabold text-highland dark:bg-highland/20 dark:text-emerald-300 border border-highland/20">
              <Tag size={12} />
              {resource.courseCode}
            </span>
          )}

          {resource.department?.name && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              <Layers size={12} className="text-highland" />
              <span className="truncate max-w-[150px]">{resource.department.name}</span>
            </span>
          )}

          {resource.university?.name && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              <Building2 size={13} className="text-highland shrink-0" />
              <span className="truncate max-w-[180px]">{resource.university.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BODY: MEDIA TEASER CARD + METADATA & UPLOADER */}
      {/* ========================================================================= */}
      <div className="pt-5 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Visual Media Card (Thumbnail / Teaser) */}
        <div className="md:col-span-4 lg:col-span-4 w-full">
          {fileDetails.kind === "youtube" && fileDetails.videoId ? (
            <div
              onClick={loadPreview}
              className="group/thumb relative aspect-video w-full overflow-hidden rounded-2xl border border-line/80 bg-stone-950 shadow-md cursor-pointer ring-1 ring-black/5 hover:ring-2 hover:ring-red-500/50 hover:shadow-xl transition-all duration-300"
              title="Click to watch video in-app"
            >
              {/* YouTube Video Cover Art */}
              <img
                src={fileDetails.thumbnailUrl}
                alt={resource.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://img.youtube.com/vi/${fileDetails.videoId}/mqdefault.jpg`;
                }}
                className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 brightness-95"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* YouTube Red Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/90 text-white shadow-xl backdrop-blur-sm group-hover/thumb:scale-115 group-hover/thumb:bg-red-600 transition-all duration-300">
                  <Play size={20} className="fill-current ml-0.5" />
                </div>
              </div>

              {/* Badges on Thumbnail */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase backdrop-blur-sm border border-white/10">
                  YouTube
                </span>
              </div>

              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] text-white/90">
                <span className="flex items-center gap-1 font-semibold drop-shadow">
                  <Eye size={12} />
                  In-App Player Ready
                </span>
                <span className="font-mono text-[10px] bg-red-600/90 text-white px-1.5 py-0.5 rounded font-bold">
                  HD
                </span>
              </div>
            </div>
          ) : fileDetails.kind === "document" ? (
            <div
              onClick={loadPreview}
              className="group/thumb relative aspect-video sm:aspect-[4/3] md:aspect-video w-full overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-stone-900 p-4 shadow-md cursor-pointer hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              title="Click to preview document in-app"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  PDF DOC
                </span>
                <FileText size={20} className="text-emerald-400 opacity-70" />
              </div>

              <div className="text-center py-2">
                <p className="font-mono text-xs font-bold text-white uppercase tracking-wider truncate">
                  {resource.courseCode || "ACADEMIC PAPER"}
                </p>
                <p className="text-[10px] text-emerald-300/80 mt-0.5 truncate">
                  {resource.title}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-400 group-hover/thumb:text-white transition-colors bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20">
                <Eye size={13} />
                <span>Inspect PDF Pages</span>
              </div>
            </div>
          ) : fileDetails.kind === "image" ? (
            <div
              onClick={loadPreview}
              className="group/thumb relative aspect-video w-full overflow-hidden rounded-2xl border border-line/80 bg-stone-900 p-2 shadow-md cursor-pointer hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              title="Click to preview image in-app"
            >
              <ImageIcon size={32} className="text-amber-400 opacity-80" />
              <div className="absolute bottom-2 text-center text-[10px] font-bold text-amber-300">
                Click to Inspect Image
              </div>
            </div>
          ) : (
            <div
              onClick={loadPreview}
              className="group/thumb relative aspect-video w-full overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-cyan-950 via-slate-900 to-stone-900 p-4 shadow-md cursor-pointer hover:border-cyan-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              title="Click to inspect link in-app"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[11px] font-extrabold text-cyan-400 border border-cyan-500/30">
                  WEB LINK
                </span>
                <Globe size={18} className="text-cyan-400" />
              </div>
              <p className="text-[11px] font-mono text-cyan-200/80 truncate">
                {resource.fileUrl || resource.usefulLinkUrl}
              </p>
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-400 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <ExternalLink size={13} />
                <span>Inspect Web Resource</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Details Column: Title, Description & Uploader Profile */}
        <div className="md:col-span-8 lg:col-span-8 space-y-4">
          {/* Resource Title */}
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-white leading-snug group-hover:text-highland transition-colors capitalize">
              {resource.title}
            </h2>
            {resource.courseCode && (
              <p className="text-xs font-semibold text-highland dark:text-emerald-400 mt-0.5">
                Course: {resource.courseCode}
              </p>
            )}
          </div>

          {/* Description Container */}
          {resource.description ? (
            <div className="relative rounded-2xl border border-line/70 bg-mist/50 dark:bg-dark-bg/60 dark:border-dark-border/70 p-3.5 sm:p-4 text-xs sm:text-sm text-ink/90 dark:text-dark-text/90 italic leading-relaxed">
              <span className="text-highland text-base font-serif select-none font-bold mr-1">“</span>
              <span className="not-italic font-normal">{resource.description}</span>
              <span className="text-highland text-base font-serif select-none font-bold ml-1">”</span>
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-muted italic">
              No description notes provided by the submitter.
            </p>
          )}

          {/* Uploader Profile Badge + Submission Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-paper/90 dark:bg-dark-bg/70 border border-line/60 dark:border-dark-border/60 p-3.5 shadow-sm">
            {/* Uploader Profile */}
            <div className="flex items-center gap-3">
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-xs shadow-md ${
                  isAdmin
                    ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-purple-500/20"
                    : "bg-gradient-to-tr from-highland to-emerald-600 shadow-highland/20"
                }`}
              >
                {getInitials(resource.uploader?.fullName || "Admin")}
                {isAdmin && (
                  <span
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-stone-950 text-[10px] font-black shadow ring-2 ring-surface dark:ring-dark-surface"
                    title="Platform Administrator"
                  >
                    ★
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink dark:text-white truncate">
                    {resource.uploader?.fullName || "Platform Admin"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isAdmin
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        : "bg-highland/10 text-highland dark:bg-emerald-500/20 dark:text-emerald-300 border border-highland/20"
                    }`}
                  >
                    {isAdmin ? "Platform Admin" : "Student Contributor"}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted dark:text-dark-muted truncate mt-0.5">
                  {resource.uploader?.email || "admin@ethiostudenthub.com"}
                </p>
              </div>
            </div>

            {/* Submission Date */}
            <div className="flex items-center gap-2 text-xs text-muted dark:text-dark-muted sm:border-l sm:border-line/60 sm:dark:border-dark-border/60 sm:pl-4 shrink-0">
              <Calendar size={14} className="text-highland" />
              <span>
                Submitted{" "}
                <strong className="text-ink dark:text-white font-semibold">
                  {new Date(resource.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTION COMMAND CENTER */}
      {/* ========================================================================= */}
      <div className="mt-6 pt-5 border-t border-line/70 dark:border-dark-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Actions: Toggle In-App Player / Preview + Raw Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-sm cursor-pointer ${
              showPreview
                ? "bg-stone-900 text-white shadow-md dark:bg-white dark:text-stone-900 hover:opacity-90"
                : isVideo
                ? "bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-300"
                : "btn-secondary text-ink dark:text-white"
            }`}
          >
            {showPreview ? (
              <ChevronUp size={16} />
            ) : isVideo ? (
              <Play size={16} className="fill-current text-red-500" />
            ) : (
              <Eye size={16} />
            )}
            <span>
              {showPreview
                ? "Close In-App Player"
                : isVideo
                ? "In-App Preview & Player"
                : "In-App Preview & Player"}
            </span>
          </button>

          {(resource.fileUrl || resource.usefulLinkUrl) && (
            <a
              href={resource.fileUrl || resource.usefulLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-3 px-3.5 inline-flex items-center gap-1.5"
              title="Inspect raw destination URL"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Source URL</span>
            </a>
          )}
        </div>

        {/* Right Actions: Approve & Reject */}
        <div className="relative flex items-center gap-3">
          {/* Approve Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => onApprove(resource.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 sm:px-6 py-3 text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>Approve & Publish</span>
          </button>

          {/* Reject with Reason Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRejectMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle size={16} />
              <span>Reject & Flag...</span>
              <ChevronDown
                size={14}
                className={showRejectMenu ? "rotate-180 transition-transform" : ""}
              />
            </button>

            {/* Rejection Reasons Dropdown */}
            {showRejectMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl border border-line/80 bg-surface p-2.5 shadow-2xl z-40 dark:border-dark-border dark:bg-dark-surface animate-in fade-in zoom-in-95 duration-150">
                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-dark-muted border-b border-line dark:border-dark-border mb-1.5">
                  Select Reason for Rejection
                </p>
                {REJECT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setShowRejectMenu(false);
                      onReject(resource.id, reason);
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-xs font-medium text-ink hover:bg-red-500/10 hover:text-red-600 dark:text-dark-text dark:hover:bg-red-500/20 transition-colors"
                  >
                    {reason}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectMenu(false);
                    onReject(resource.id);
                  }}
                  className="w-full text-left rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-t border-line dark:border-dark-border mt-1.5 pt-2"
                >
                  Quick Reject (No reason tag)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXPANDABLE IN-APP MEDIA INSPECTION CANVAS */}
      {/* ========================================================================= */}
      {showPreview && (
        <div className="mt-6 border-t border-line/70 dark:border-dark-border/70 pt-6 space-y-4 animate-in fade-in duration-300">
          {/* Header Sandbox Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-mist/60 dark:bg-dark-bg/60 p-4 border border-line dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-2">
                  Sandbox In-App Inspection Active
                  {fileDetails.isExternalVideo && (
                    <span className="rounded-full bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 text-[10px] font-extrabold border border-red-500/30">
                      16:9 Cinema Player
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  Inspect the complete media stream or document below to verify academic quality and safety.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(resource.fileUrl || resource.usefulLinkUrl) && (
                <a
                  href={resource.fileUrl || resource.usefulLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11px] py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  Raw Source URL
                </a>
              )}
              {!fileDetails.isExternalVideo && (
                <button
                  type="button"
                  onClick={handleDirectDownload}
                  className="btn-secondary text-[11px] py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download File
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {previewLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-line/60 bg-paper dark:bg-dark-surface">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-highland border-t-transparent" />
              <p className="text-xs font-semibold text-muted dark:text-dark-muted">
                Streaming uploaded file for in-app inspection...
              </p>
            </div>
          )}

          {/* Error State */}
          {previewError && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3 dark:border-amber-500/20">
              <AlertTriangle size={24} className="mx-auto text-amber-500" />
              <p className="text-xs font-semibold text-ink dark:text-white max-w-md mx-auto">
                {previewError}
              </p>
              {resource.fileUrl && (
                <div className="pt-2">
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open Uploaded URL in New Tab
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CINEMA VIEWER: YOUTUBE, VIMEO, VIDEO, PDF, IMAGE */}
          {/* ========================================================================= */}
          {previewData && !previewLoading && (
            <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-2xl dark:border-dark-border">
              {/* 1. YOUTUBE IN-APP PLAYER */}
              {previewData.kind === "youtube" && (
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <iframe
                    src={previewData.url}
                    title={resource.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {/* 2. VIMEO IN-APP PLAYER */}
              {previewData.kind === "vimeo" && (
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <iframe
                    src={previewData.url}
                    title={resource.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {/* 3. HTML5 DIRECT VIDEO PLAYER (.mp4, .webm) */}
              {previewData.kind === "video" && !previewData.isExternalVideo && (
                <div className="relative bg-black p-2">
                  <video
                    src={previewData.url}
                    controls
                    preload="metadata"
                    className="max-h-[70vh] w-full rounded-xl"
                  />
                </div>
              )}

              {/* 4. IMAGE DOCUMENT PREVIEW */}
              {previewData.isImage && (
                <div className="relative max-h-[75vh] overflow-y-auto bg-stone-950 p-4 text-center">
                  <img
                    src={previewData.url}
                    alt={resource.title}
                    className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl shadow-2xl object-contain bg-white"
                  />
                </div>
              )}

              {/* 5. PDF & ACADEMIC DOCUMENT READER */}
              {(previewData.isPdf ||
                (!previewData.isImage &&
                  !previewData.isExternalVideo &&
                  previewData.kind === "document")) && (
                <div className="relative w-full bg-stone-950">
                  <object
                    data={`${previewData.url}#toolbar=1&navpanes=0`}
                    type="application/pdf"
                    className="h-[75vh] min-h-[520px] w-full rounded-xl"
                  >
                    <iframe
                      src={`${previewData.url}#toolbar=1`}
                      title={`Moderation preview of ${resource.title}`}
                      className="h-[75vh] min-h-[520px] w-full rounded-xl border-0 bg-white"
                    />
                  </object>
                </div>
              )}

              {/* 6. GENERAL EXTERNAL LINK (NON-VIDEO) */}
              {previewData.kind === "link" && !fileDetails.isExternalVideo && (
                <div className="p-8 text-center space-y-4 bg-mist/30 dark:bg-dark-surface/50">
                  <Globe size={38} className="mx-auto text-highland" />
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">
                      External Web Resource Link
                    </p>
                    <p className="text-xs font-mono text-muted dark:text-dark-muted break-all mt-2 max-w-xl mx-auto p-2.5 rounded-xl bg-surface dark:bg-dark-surface border border-line dark:border-dark-border">
                      {resource.fileUrl || resource.usefulLinkUrl}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <a
                      href={resource.fileUrl || resource.usefulLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 shadow-md shadow-highland/20"
                    >
                      <ExternalLink size={14} /> Open & Inspect Destination Site
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification Checklist */}
          <div className="rounded-2xl border border-line bg-paper dark:bg-dark-surface dark:border-dark-border p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted dark:text-dark-muted">
            <span className="font-bold text-ink dark:text-white flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-highland" /> Moderator Verification Checklist:
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-highland" /> Higher Education Relevance
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-highland" /> Free of Malware & Phishing
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-highland" /> Legible Academic Quality
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
