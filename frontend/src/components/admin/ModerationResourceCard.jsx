import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Film,
  Image as ImageIcon,
  Building2,
  UserRound,
  Calendar,
  Lock,
  Globe,
  Maximize2,
  FileCode,
  Sparkles,
  Play,
  Check,
  Info,
  CornerDownRight,
  Shield,
  HelpCircle,
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

export const getFileTypeDetails = (resource) => {
  const rawUrl = resource.fileUrl || resource.usefulLinkUrl || "";
  const ext = getFileExtension(rawUrl);
  const ytId = getYouTubeVideoId(rawUrl);
  const vimeoId = getVimeoVideoId(rawUrl);

  if (ytId) {
    return {
      kind: "youtube",
      label: "YouTube Video",
      icon: Film,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0`,
      videoId: ytId,
      isExternalVideo: true,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
    };
  }

  if (vimeoId) {
    return {
      kind: "vimeo",
      label: "Vimeo Video",
      icon: Film,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      videoId: vimeoId,
      isExternalVideo: true,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    };
  }

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return {
      kind: "image",
      label: `Image (${ext.slice(1).toUpperCase()})`,
      icon: ImageIcon,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
  }

  if (ext === ".mp4" || ext === ".webm" || ext === ".mov" || resource.type === "VIDEO") {
    return {
      kind: "video",
      label: "Direct Video Stream",
      icon: Film,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    };
  }

  if (resource.type === "USEFUL_LINK") {
    return {
      kind: "link",
      label: "Web Resource Link",
      icon: Globe,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    };
  }

  return {
    kind: "document",
    label: ext ? `Document (${ext.slice(1).toUpperCase()})` : "PDF / Academic Paper",
    icon: FileText,
    color: "text-highland bg-highland/10 border-highland/20",
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
    // If it's a YouTube or Vimeo video, we don't need to fetch a blob! We embed directly!
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
          "Unable to load in-app file stream. Click 'Open Direct Link' below to inspect the uploaded asset."
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
    <div className="surface-card rounded-2xl border border-line/80 bg-surface dark:bg-dark-surface dark:border-dark-border p-5 shadow-sm transition-all duration-200 hover:border-highland/40 hover:shadow-md">
      {/* Top Header & Main Info */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-gold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              PENDING SAFETY REVIEW
            </span>
            <span className={`badge border flex items-center gap-1.5 ${fileDetails.color}`}>
              <IconComponent size={13} />
              {fileDetails.label}
            </span>
            <span className="badge">{resource.type?.replaceAll("_", " ")}</span>
            {resource.university?.name && (
              <span className="badge flex items-center gap-1 text-highland dark:text-emerald-400">
                <Building2 size={12} />
                {resource.university.name}
              </span>
            )}
            {resource.courseCode && (
              <span className="badge bg-highland/10 text-highland dark:bg-highland/20 font-mono font-bold">
                {resource.courseCode}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-ink dark:text-white leading-snug">
            {resource.title}
          </h2>

          {resource.description && (
            <p className="text-sm text-ink/80 dark:text-dark-text/80 line-clamp-2 max-w-3xl">
              {resource.description}
            </p>
          )}

          {/* Uploader & Security Info Bar */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted dark:text-dark-muted pt-1">
            <span className="flex items-center gap-1.5">
              <UserRound size={13} className="text-highland" />
              Uploader: <strong className="text-ink dark:text-white">{resource.uploader?.fullName || "Student"}</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-muted/90">{resource.uploader?.email}</span>
            <span>•</span>
            <span>Submitted {new Date(resource.createdAt).toLocaleDateString()}</span>
            {resource.instructor && (
              <>
                <span>•</span>
                <span>Instructor: <strong>{resource.instructor}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative flex flex-wrap items-center gap-2.5 lg:self-start shrink-0">
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              showPreview
                ? "bg-highland text-white shadow-md shadow-highland/20"
                : "btn-secondary text-ink dark:text-white"
            }`}
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? "Hide In-App Player" : "In-App Preview & Player"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => onApprove(resource.id)}
            className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md shadow-highland/20 hover:scale-[1.02] transition-transform"
          >
            <CheckCircle2 size={16} />
            Approve & Publish
          </button>

          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRejectMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <XCircle size={16} />
              Reject & Flag...
            </button>

            {/* Rejection Reasons Dropdown */}
            {showRejectMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-line/80 bg-surface p-2 shadow-2xl z-30 dark:border-dark-border dark:bg-dark-surface animate-in fade-in zoom-in-95 duration-150">
                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-dark-muted border-b border-line dark:border-dark-border mb-1">
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
                    className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-red-500/10 hover:text-red-600 dark:text-dark-text dark:hover:bg-red-500/20 transition-colors"
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
                  className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-t border-line dark:border-dark-border mt-1"
                >
                  Reject without reason tag
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable In-App File Inspector & Embedded Video/PDF Player */}
      {showPreview && (
        <div className="mt-5 border-t border-line/70 dark:border-dark-border/70 pt-5 space-y-4 animate-in fade-in duration-200">
          {/* Moderator File Inspection Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-mist/60 dark:bg-dark-surface/60 p-3.5 border border-line dark:border-dark-border">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-2">
                  Content Safety Inspection Sandbox
                  {fileDetails.isExternalVideo && (
                    <span className="badge-green text-[10px] font-semibold">Embedded In-App Player</span>
                  )}
                </p>
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  Inspect the complete media/document stream below to verify it does not contain malicious code, spam, or scams.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(resource.fileUrl || resource.usefulLinkUrl) && (
                <a
                  href={resource.fileUrl || resource.usefulLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  Raw Source URL
                </a>
              )}
              {!fileDetails.isExternalVideo && (
                <button
                  type="button"
                  onClick={handleDirectDownload}
                  className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <Download size={13} />
                  Download File
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {previewLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-xl border border-line/60 bg-paper dark:bg-dark-surface">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-highland border-t-transparent" />
              <p className="text-xs font-semibold text-muted dark:text-dark-muted">
                Streaming uploaded file for in-app inspection...
              </p>
            </div>
          )}

          {/* Error State */}
          {previewError && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3 dark:border-amber-500/20">
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
          {/* INTERACTIVE MEDIA & DOCUMENT PLAYERS (PREVIEW RIGHT ON THE PAGE) */}
          {/* ========================================================================= */}
          {previewData && !previewLoading && (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-md dark:bg-dark-surface dark:border-dark-border">
              {/* 1. YOUTUBE VIDEO EMBEDDED IN-APP PLAYER */}
              {previewData.kind === "youtube" && (
                <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
                  <iframe
                    src={previewData.url}
                    title={resource.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {/* 2. VIMEO VIDEO EMBEDDED IN-APP PLAYER */}
              {previewData.kind === "vimeo" && (
                <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
                  <iframe
                    src={previewData.url}
                    title={resource.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {/* 3. DIRECT HTML5 VIDEO PLAYER (.mp4, .webm) */}
              {previewData.kind === "video" && !previewData.isExternalVideo && (
                <div className="relative bg-black p-2 rounded-xl">
                  <video
                    src={previewData.url}
                    controls
                    preload="metadata"
                    className="max-h-[65vh] w-full rounded-lg"
                  />
                </div>
              )}

              {/* 4. IMAGE DOCUMENT PREVIEW */}
              {previewData.isImage && (
                <div className="relative max-h-[70vh] overflow-y-auto bg-stone-900/90 p-4 text-center">
                  <img
                    src={previewData.url}
                    alt={resource.title}
                    className="mx-auto max-h-[65vh] w-auto max-w-full rounded-lg shadow-xl object-contain bg-white"
                  />
                </div>
              )}

              {/* 5. PDF & ACADEMIC DOCUMENT READER */}
              {(previewData.isPdf ||
                (!previewData.isImage &&
                  !previewData.isExternalVideo &&
                  previewData.kind === "document")) && (
                <div className="relative w-full bg-stone-900/80">
                  <object
                    data={`${previewData.url}#toolbar=1&navpanes=0`}
                    type="application/pdf"
                    className="h-[75vh] min-h-[500px] w-full rounded-lg"
                  >
                    <iframe
                      src={`${previewData.url}#toolbar=1`}
                      title={`Moderation preview of ${resource.title}`}
                      className="h-[75vh] min-h-[500px] w-full rounded-lg border-0 bg-white"
                    />
                  </object>
                </div>
              )}

              {/* 6. GENERAL EXTERNAL LINK (NON-VIDEO) */}
              {previewData.kind === "link" && !fileDetails.isExternalVideo && (
                <div className="p-6 text-center space-y-4 bg-mist/30 dark:bg-dark-surface/50">
                  <Globe size={36} className="mx-auto text-highland" />
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">
                      External Web Resource Link
                    </p>
                    <p className="text-xs font-mono text-muted dark:text-dark-muted break-all mt-1.5 max-w-xl mx-auto p-2 rounded-lg bg-surface dark:bg-dark-surface border border-line dark:border-dark-border">
                      {resource.fileUrl || resource.usefulLinkUrl}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <a
                      href={resource.fileUrl || resource.usefulLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-md shadow-highland/20"
                    >
                      <ExternalLink size={14} /> Open & Inspect Destination Site
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Moderator Safety Checklist */}
          <div className="rounded-xl border border-line bg-paper dark:bg-dark-surface dark:border-dark-border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted dark:text-dark-muted">
            <span className="font-semibold text-ink dark:text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-highland" /> Verification Checks:
            </span>
            <span className="flex items-center gap-1">
              <Check size={13} className="text-highland" /> Higher Education Material
            </span>
            <span className="flex items-center gap-1">
              <Check size={13} className="text-highland" /> No Embedded Phishing / Malware
            </span>
            <span className="flex items-center gap-1">
              <Check size={13} className="text-highland" /> Legible Academic Quality
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
