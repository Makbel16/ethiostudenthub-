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
} from "lucide-react";
import api from "../../api/client.js";

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

const getFileTypeDetails = (resource) => {
  const url = resource.fileUrl || "";
  const ext = getFileExtension(url);

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return { kind: "image", label: `Image (${ext.slice(1).toUpperCase()})`, icon: ImageIcon };
  }
  if (ext === ".mp4" || ext === ".webm" || resource.type === "VIDEO") {
    return { kind: "video", label: "Video Stream", icon: Film };
  }
  if (resource.type === "USEFUL_LINK") {
    return { kind: "link", label: "External Useful Link", icon: Globe };
  }
  return { kind: "document", label: ext ? `Document (${ext.slice(1).toUpperCase()})` : "PDF / Academic Document", icon: FileText };
};

export default function ModerationResourceCard({ resource, onApprove, onReject, isPending }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const blobUrlRef = useRef(null);

  const fileDetails = getFileTypeDetails(resource);
  const IconComponent = fileDetails.icon;

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
    if (previewData) {
      setShowPreview(true);
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");
    setShowPreview(true);

    try {
      if (fileDetails.kind === "link") {
        setPreviewData({ url: resource.fileUrl || resource.usefulLinkUrl, kind: "link" });
        return;
      }

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

  return (
    <div className="surface-card rounded-2xl border border-line/80 bg-surface dark:bg-dark-surface dark:border-dark-border p-5 shadow-sm transition-all duration-200 hover:border-highland/40">
      {/* Top Header & Main Info */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-gold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              PENDING SAFETY REVIEW
            </span>
            <span className="badge flex items-center gap-1.5">
              <IconComponent size={13} className="text-highland" />
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
              <span className="badge bg-highland/10 text-highland dark:bg-highland/20 font-mono">
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 lg:self-start shrink-0">
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
            {showPreview ? "Hide Preview" : "Inspect & Preview"}
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

          <button
            type="button"
            disabled={isPending}
            onClick={() => onReject(resource.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <XCircle size={16} />
            Reject & Flag
          </button>
        </div>
      </div>

      {/* Expandable In-App File Inspector Panel */}
      {showPreview && (
        <div className="mt-5 border-t border-line/70 dark:border-dark-border/70 pt-5 space-y-4 animate-in fade-in duration-200">
          {/* Moderator File Inspection Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-mist/60 dark:bg-dark-surface/60 p-3.5 border border-line dark:border-dark-border">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink dark:text-white">
                  Content Safety Inspection Sandbox
                </p>
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  Verify the file does not contain inappropriate content, copyright breaches, or malware.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  Open Direct URL
                </a>
              )}
              <button
                type="button"
                onClick={handleDirectDownload}
                className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
              >
                <Download size={13} />
                Download to Scan
              </button>
            </div>
          </div>

          {/* Loading State */}
          {previewLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-xl border border-line/60 bg-paper dark:bg-dark-surface">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-highland border-t-transparent" />
              <p className="text-xs font-semibold text-muted dark:text-dark-muted">
                Streaming uploaded file for inspection...
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

          {/* Interactive Document / Media Viewers */}
          {previewData && !previewLoading && (
            <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-inner dark:bg-dark-surface dark:border-dark-border">
              {/* IMAGE PREVIEW */}
              {previewData.isImage && (
                <div className="relative max-h-[70vh] overflow-y-auto bg-stone-900/90 p-4 text-center">
                  <img
                    src={previewData.url}
                    alt={resource.title}
                    className="mx-auto max-h-[65vh] w-auto max-w-full rounded-lg shadow-xl object-contain bg-white"
                  />
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {previewData.kind === "video" && (
                <div className="relative bg-black p-2 rounded-xl">
                  <video
                    src={previewData.url}
                    controls
                    preload="metadata"
                    className="max-h-[65vh] w-full rounded-lg"
                  />
                </div>
              )}

              {/* PDF & DOCUMENT PREVIEW */}
              {(previewData.isPdf || (!previewData.isImage && previewData.kind === "document")) && (
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

              {/* EXTERNAL USEFUL LINK INSPECTION */}
              {previewData.kind === "link" && (
                <div className="p-6 text-center space-y-4 bg-mist/30 dark:bg-dark-surface/50">
                  <Globe size={32} className="mx-auto text-highland" />
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">
                      External Link Resource
                    </p>
                    <p className="text-xs font-mono text-muted dark:text-dark-muted break-all mt-1">
                      {resource.fileUrl || resource.usefulLinkUrl}
                    </p>
                  </div>
                  <a
                    href={resource.fileUrl || resource.usefulLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open & Inspect Destination Site
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
