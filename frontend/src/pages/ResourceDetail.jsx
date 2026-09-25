import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  BookOpen,
  Building2,
  CalendarDays,
  Download,
  Eye,
  ExternalLink,
  Heart,
  MessageCircle,
  Tag,
  Trash2,
  UserRound,
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FastForward,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AIMessageContent from "../components/ai/AIMessageContent.jsx";

const LEVEL_LABELS = {
  YEAR_1: "Year 1",
  YEAR_2: "Year 2",
  YEAR_3: "Year 3",
  YEAR_4: "Year 4",
  YEAR_5: "Year 5",
  YEAR_6: "Year 6",
  MASTERS: "Master's",
  PHD: "PhD",
};

const SEMESTER_LABELS = {
  SEMESTER_1: "Semester 1",
  SEMESTER_2: "Semester 2",
  SUMMER: "Summer",
};

const typeLabel = (type) => type?.replaceAll("_", " ") || "RESOURCE";

const USEFUL_LINK_TYPE = "USEFUL_LINK";

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
    if (["shorts", "embed"].includes(section)) return normalizeYouTubeId(id);
  } catch {
    return null;
  }

  return null;
};

const normalizeYouTubeId = (value) => {
  const id = String(value || "").trim();
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
};

const getFileExtension = (fileUrl = "") => {
  try {
    const pathname = new URL(fileUrl).pathname;
    return pathname.includes(".") ? pathname.slice(pathname.lastIndexOf(".")).toLowerCase() : "";
  } catch {
    const cleanUrl = fileUrl.split(/[?#]/)[0];
    return cleanUrl.includes(".") ? cleanUrl.slice(cleanUrl.lastIndexOf(".")).toLowerCase() : "";
  }
};

const getPreviewKind = (resource) => {
  if (!resource) return null;
  const fileUrl = resource.fileUrl || "";
  const extension = getFileExtension(fileUrl);

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension)) return "image";
  if (extension === ".mp4" || extension === ".webm" || resource.type === "VIDEO") return "video";
  if (
    extension === ".pdf" ||
    fileUrl.includes(".pdf") ||
    [
      "PREVIOUS_EXAM",
      "MODEL_EXAM",
      "LECTURE_NOTE",
      "BOOK",
      "ASSIGNMENT",
      "LAB_MANUAL",
      "RESEARCH_PAPER",
      "CHEAT_SHEET",
    ].includes(resource.type)
  ) {
    return "document";
  }
  return null;
};

const getFilenameFromDisposition = (disposition, fallback) => {
  const fallbackName = fallback || "resource";
  if (!disposition) return fallbackName;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return fallbackName;
    }
  }

  return disposition.match(/filename="([^"]+)"/i)?.[1] || fallbackName;
};

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [fileActionError, setFileActionError] = useState("");
  const [isOpeningFile, setIsOpeningFile] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  
  // AI Chat state
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInputMessage, setAiInputMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiChatMaximized, setAiChatMaximized] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const chatContainerRef = useRef(null);
  const aiMessagesEndRef = useRef(null);
  const modalChatContainerRef = useRef(null);
  const modalAiMessagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const {
    data: resource,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => api.get(`/resources/${id}`).then((r) => r.data),
  });

  const isUsefulLinkResource = resource?.type === USEFUL_LINK_TYPE;

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

  const blobUrlRef = useRef(null);

  const preview = useQuery({
    queryKey: ["resource-preview", id],
    queryFn: async () => {
      const response = await api.get(`/resources/${id}/open`, { responseType: "blob" });
      const contentType =
        response.headers?.["content-type"] ||
        (getPreviewKind(resource) === "image" ? "image/png" : "application/pdf");
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        contentType,
        isImage: contentType.startsWith("image/"),
        isPdf: contentType.includes("pdf"),
      };
    },
    enabled: Boolean(resource && !isUsefulLinkResource && getPreviewKind(resource)),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });

  useEffect(() => {
    if (preview.data?.url) {
      if (blobUrlRef.current && blobUrlRef.current !== preview.data.url) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = preview.data.url;
    }
  }, [preview.data?.url]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // AI Chat functions & auto-scroll (strictly scoped to chat box, NEVER scrolls the window/page)
  const scrollToBottom = (smooth = true) => {
    const containers = [chatContainerRef.current, modalChatContainerRef.current].filter(Boolean);
    containers.forEach((container) => {
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [aiMessages.length, aiLoading]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current?.timer) {
        clearInterval(typingTimerRef.current.timer);
      }
    };
  }, []);

  const typewriteResponse = (fullText) => {
    const assistantId = `assistant-${Date.now()}`;
    setAiMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", isTyping: true },
    ]);

    let currentIndex = 0;
    const totalLength = fullText.length;
    // Chunk size: reveal 2-5 chars per tick depending on text length
    const step = totalLength > 800 ? 5 : totalLength > 300 ? 3 : 2;
    const speed = 16;

    const timer = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= totalLength) {
        clearInterval(timer);
        typingTimerRef.current = null;
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: fullText, isTyping: false }
              : msg
          )
        );
        setTimeout(() => scrollToBottom(true), 40);
      } else {
        const partial = fullText.slice(0, currentIndex);
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: partial } : msg
          )
        );
        scrollToBottom(false);
      }
    }, speed);

    typingTimerRef.current = {
      timer,
      skip: () => {
        clearInterval(timer);
        typingTimerRef.current = null;
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: fullText, isTyping: false }
              : msg
          )
        );
        setTimeout(() => scrollToBottom(true), 40);
      },
    };
  };

  const sendAiMessage = async (customPrompt = null) => {
    const messageToSend = typeof customPrompt === "string" ? customPrompt : aiInputMessage;
    if (!messageToSend || !messageToSend.trim() || aiLoading) return;

    if (typingTimerRef.current) {
      typingTimerRef.current.skip();
    }

    const userText = messageToSend.trim();
    setAiInputMessage("");
    setAiError(null);

    const userId = `user-${Date.now()}`;
    setAiMessages((prev) => [...prev, { id: userId, role: "user", content: userText }]);
    setAiLoading(true);

    // Auto-scroll down immediately when user clicks send!
    setTimeout(() => scrollToBottom(true), 25);

    try {
      const response = await api.post("/ai/chat", {
        message: userText,
        context: `Academic resource tutoring context:\nTitle: ${resource?.title || ""}\nCourse Code: ${resource?.courseCode || ""}\nUniversity: ${resource?.university?.name || ""}\nDepartment: ${resource?.department?.name || ""}\nAcademic Type: ${resource?.type || ""}\nDescription: ${resource?.description || ""}`,
      });

      setAiLoading(false);
      const replyText =
        response.data?.response || "I could not generate a response. Please try asking again.";
      typewriteResponse(replyText);
    } catch (error) {
      console.error("AI tutoring error:", error);
      setAiLoading(false);
      setAiError(
        error.response?.data?.error || "Failed to reach AI Tutor. Please try again."
      );
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  const handleAiKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
  };

  const handleClearChat = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current.timer);
      typingTimerRef.current = null;
    }
    setAiMessages([]);
    setAiError(null);
  };

  const handleCopyAnswer = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  if (isLoading) return <p className="page-shell py-12 text-sm text-muted">Loading resource...</p>;
  if (isError || !resource) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">Resource not found or unavailable.</div>
      </div>
    );
  }

  const canManage = user && (user.id === resource.uploader?.id || ["ADMIN", "MODERATOR"].includes(user.role));
  const previewKind = isUsefulLinkResource ? null : getPreviewKind(resource);
  const youtubeVideoId = isUsefulLinkResource ? getYouTubeVideoId(resource.fileUrl) : null;
  const youtubeEmbedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null;
  const relatedUsefulLinkUrl = !isUsefulLinkResource ? resource.usefulLinkUrl : null;

  const handleOpenLink = () => {
    setFileActionError("");
    const openedWindow = window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      setFileActionError("Could not open this link. Please allow pop-ups for this site and try again.");
    }
  };

  const handleOpenFile = async () => {
    setFileActionError("");
    setIsOpeningFile(true);

    try {
      let openUrl = preview.data?.url;
      if (!openUrl) {
        const response = await api.get(`/resources/${id}/open`, { responseType: "blob" });
        const contentType = response.headers?.["content-type"] || "application/pdf";
        const blob = new Blob([response.data], { type: contentType });
        openUrl = URL.createObjectURL(blob);
        setTimeout(() => URL.revokeObjectURL(openUrl), 60_000);
      }

      window.open(openUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setFileActionError(err.response?.data?.error || "Could not open this file. Please retry.");
    } finally {
      setIsOpeningFile(false);
    }
  };

  const handleDownloadFile = async () => {
    setFileActionError("");
    setIsDownloadingFile(true);

    try {
      const response = await api.get(`/resources/${id}/download`, { responseType: "blob" });
      const contentType = response.headers?.["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = getFilenameFromDisposition(response.headers?.["content-disposition"], resource.title);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      setTimeout(invalidate, 800);
    } catch (err) {
      setFileActionError(err.response?.data?.error || "Could not download this file. Please retry.");
    } finally {
      setIsDownloadingFile(false);
    }
  };

  const metaItems = [
    resource.university?.name && { icon: Building2, label: "University", value: resource.university.name },
    resource.department?.name && { icon: Building2, label: "Department", value: resource.department.name },
    resource.courseCode && { icon: BookMetaIcon, label: "Course code", value: resource.courseCode },
    resource.level && { icon: CalendarDays, label: "Level", value: LEVEL_LABELS[resource.level] || resource.level },
    resource.semester && { icon: CalendarDays, label: "Semester", value: SEMESTER_LABELS[resource.semester] || resource.semester },
    resource.academicYear && { icon: CalendarDays, label: "Academic year", value: resource.academicYear },
  ].filter(Boolean);

  return (
    <div className="page-shell py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="section-panel rounded-xl p-6 sm:p-8 max-h-[calc(187vh-100px)] overflow-y-auto">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge-green">{typeLabel(resource.type)}</span>
                {resource.status && resource.status !== "APPROVED" && <span className="badge-gold">{resource.status}</span>}
                {resource.examType && <span className="badge">{resource.examType}</span>}
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink dark:text-dark-text">{resource.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted dark:text-dark-muted">
                <UserRound size={16} />
                Uploaded by {resource.uploader?.fullName || "Student contributor"}
                {resource.college?.name && <span>- {resource.college.name}</span>}
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${resource.title}"? This cannot be undone.`)) deleteResource.mutate();
                }}
                className="btn-secondary border-ember/30 text-ember hover:border-ember hover:text-ember"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>

          {resource.description && (
            <p className="mt-8 rounded-lg border border-line bg-paper p-5 text-sm leading-7 text-ink/80 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text/80">
              {resource.description}
            </p>
          )}

          {metaItems.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={`${item.label}-${item.value}`} className="rounded-lg border border-line bg-white p-4 dark:bg-dark-surface dark:border-dark-border">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted dark:text-dark-muted">
                      <Icon size={15} className="text-highland" />
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink dark:text-dark-text">{item.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {resource.tags?.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink dark:text-dark-text">
                <Tag size={16} className="text-highland" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {relatedUsefulLinkUrl && (
            <section className="mt-10 border-t border-line pt-8">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Useful Link</h2>
                  <p className="mt-1 text-sm text-muted dark:text-dark-muted">Related to this material.</p>
                </div>
                <a
                  href={relatedUsefulLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              </div>
              <a
                href={relatedUsefulLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-paper p-4 text-sm font-semibold text-highland hover:border-highland dark:bg-dark-surface dark:border-dark-border"
              >
                <ExternalLink size={16} className="shrink-0" />
                <span className="min-w-0 truncate">{relatedUsefulLinkUrl}</span>
              </a>
            </section>
          )}

          {youtubeEmbedUrl && (
            <section className="mt-10 border-t border-line pt-8">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Video</h2>
                <button type="button" onClick={handleOpenLink} className="btn-secondary">
                  <ExternalLink size={16} />
                  Open Link
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-line bg-black">
                <iframe
                  src={youtubeEmbedUrl}
                  title={`${resource.title} YouTube video`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {previewKind && (
            <section className="mt-10 border-t border-line pt-8 dark:border-dark-border">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Document Preview</h2>
                  <span className="badge-green text-xs font-semibold">Verified Material</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenFile}
                    disabled={isOpeningFile}
                    className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    {isOpeningFile ? "Opening..." : "Full Screen / New Tab"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    disabled={isDownloadingFile}
                    className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    {isDownloadingFile ? "Downloading..." : "Download"}
                  </button>
                </div>
              </div>

              {preview.isLoading && (
                <div className="empty-state py-12 flex flex-col items-center justify-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-highland border-t-transparent" />
                  <p className="text-sm font-medium text-muted dark:text-dark-muted">Loading document preview...</p>
                </div>
              )}

              {preview.isError && (
                <div className="rounded-xl border border-line bg-paper p-8 text-center dark:border-dark-border dark:bg-dark-surface space-y-4">
                  <p className="text-sm font-medium text-ink dark:text-dark-text">
                    Could not display the document preview directly in this browser frame.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={handleOpenFile} className="btn-secondary text-xs">
                      <ExternalLink size={14} /> Open in New Tab
                    </button>
                    <button type="button" onClick={handleDownloadFile} className="btn-primary text-xs">
                      <Download size={14} /> Download Document
                    </button>
                  </div>
                </div>
              )}

              {preview.data && (
                <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm dark:bg-dark-surface dark:border-dark-border">
                  {/* Image Document / Fallback Render */}
                  {(preview.data.isImage || previewKind === "image") && (
                    <div className="relative group max-h-[85vh] overflow-y-auto bg-stone-100 dark:bg-neutral-900 p-2 sm:p-4 text-center">
                      <img
                        src={preview.data.url}
                        alt={resource.title}
                        className="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg shadow-md object-contain bg-white"
                      />
                    </div>
                  )}

                  {/* Video Document */}
                  {previewKind === "video" && (
                    <video
                      src={preview.data.url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-black rounded-lg"
                    />
                  )}

                  {/* PDF Document Reader */}
                  {(preview.data.isPdf || (!preview.data.isImage && previewKind === "document")) && (
                    <div className="relative w-full bg-stone-100 dark:bg-neutral-900">
                      <object
                        data={`${preview.data.url}#toolbar=1&navpanes=0`}
                        type="application/pdf"
                        className="h-[80vh] min-h-[550px] w-full rounded-lg"
                      >
                        <iframe
                          src={`${preview.data.url}#toolbar=1`}
                          title={`${resource.title} file preview`}
                          className="h-[80vh] min-h-[550px] w-full rounded-lg border-0 bg-white"
                        />
                      </object>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="mt-10 border-t border-line pt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">Discussion</h2>
                <p className="mt-1 text-sm text-muted dark:text-dark-muted">Ask for context, corrections, or missing details.</p>
              </div>
              <span className="badge">{resource.comments?.length ?? 0} comments</span>
            </div>

            {user ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (comment.trim()) postComment.mutate(comment.trim());
                }}
                className="mb-6 rounded-lg border border-line bg-paper p-3 dark:bg-dark-surface dark:border-dark-border"
              >
                <label className="sr-only" htmlFor="comment">Add a comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a helpful comment"
                  rows={3}
                  className="input-field resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button disabled={postComment.isPending} className="btn-primary">
                    <MessageCircle size={16} />
                    Post comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-lg border border-line bg-paper p-4 text-sm text-muted dark:bg-dark-surface dark:border-dark-border dark:text-dark-muted">
                <Link to="/login" className="font-semibold text-highland">Log in</Link> to comment, like, or bookmark this resource.
              </div>
            )}

            {resource.comments?.length === 0 && <div className="empty-state">No comments yet.</div>}
            <ul className="space-y-3">
              {resource.comments?.map((c) => (
                <li key={c.id} className="rounded-lg border border-line bg-white p-4 dark:bg-dark-surface dark:border-dark-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink dark:text-dark-text">{c.user?.fullName || "Student"}</p>
                      <p className="mt-1 text-sm leading-6 text-muted dark:text-dark-muted">{c.content}</p>
                    </div>
                    {user && (user.id === c.user?.id || ["ADMIN", "MODERATOR"].includes(user.role)) && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="text-xs font-semibold text-ember hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="section-panel rounded-xl p-5">
            {isUsefulLinkResource ? (
              <button type="button" onClick={handleOpenLink} className="btn-dark w-full">
                <ExternalLink size={18} />
                Open Link
              </button>
            ) : (
              <div className="space-y-3">
                <button type="button" onClick={handleOpenFile} disabled={isOpeningFile} className="btn-secondary w-full">
                  <ExternalLink size={18} />
                  {isOpeningFile ? "Opening..." : "Open file"}
                </button>
                <button type="button" onClick={handleDownloadFile} disabled={isDownloadingFile} className="btn-dark w-full">
                  <Download size={18} />
                  {isDownloadingFile ? "Downloading..." : "Download file"}
                </button>
              </div>
            )}
            {fileActionError && <p className="mt-3 text-center text-xs font-semibold text-ember">{fileActionError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button disabled={!user || like.isPending} onClick={() => like.mutate()} className="btn-secondary">
                <Heart size={16} />
                {resource._count?.likes ?? 0}
              </button>
              <button disabled={!user || bookmark.isPending} onClick={() => bookmark.mutate()} className="btn-secondary">
                <Bookmark size={16} />
                Save
              </button>
            </div>
            {!user && <p className="mt-3 text-center text-xs text-muted dark:text-dark-muted">Log in to like or save resources.</p>}
          </div>

          <div className="section-panel rounded-xl p-5">
            <p className="font-semibold text-ink dark:text-dark-text">Resource activity</p>
            <dl className="mt-4 space-y-3 text-sm">
              {!isUsefulLinkResource && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted dark:text-dark-muted"><Download size={15} /> Downloads</dt>
                  <dd className="font-semibold text-ink dark:text-dark-text">{resource.downloadCount ?? 0}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted dark:text-dark-muted"><Eye size={15} /> Views</dt>
                <dd className="font-semibold text-ink dark:text-dark-text">{resource.viewCount ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted dark:text-dark-muted"><Bookmark size={15} /> Bookmarks</dt>
                <dd className="font-semibold text-ink dark:text-dark-text">{resource._count?.bookmarks ?? 0}</dd>
              </div>
            </dl>
          </div>

          {user ? (
            <AIChatBox
              isMaximized={false}
              onToggleMaximize={() => setAiChatMaximized(true)}
              messages={aiMessages}
              loading={aiLoading}
              error={aiError}
              inputMessage={aiInputMessage}
              setInputMessage={setAiInputMessage}
              onSend={sendAiMessage}
              onKeyPress={handleAiKeyPress}
              onClear={handleClearChat}
              onCopy={handleCopyAnswer}
              copiedId={copiedMessageId}
              isTypingActive={Boolean(typingTimerRef.current)}
              onSkipTyping={() => typingTimerRef.current?.skip()}
              containerRef={chatContainerRef}
              messagesEndRef={aiMessagesEndRef}
              resource={resource}
              user={user}
            />
          ) : (
            <div className="rounded-3xl border border-line/80 dark:border-dark-border/80 bg-gradient-to-br from-surface to-mist/40 dark:from-dark-surface dark:to-dark-bg/60 p-6 text-center shadow-sm space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md mx-auto">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink dark:text-white">
                  AI Academic Study Tutor
                </h3>
                <p className="text-xs text-muted dark:text-dark-muted mt-1 leading-relaxed">
                  Log in to get instant answers, summaries, code explanations, and practice quiz questions on this resource.
                </p>
              </div>
              <Link to="/login" className="btn-primary text-xs py-2.5 px-4 w-full justify-center inline-flex">
                Log In to Chat with AI
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Expanded Focus Mode AI Study Modal */}
      {aiChatMaximized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[90vh] max-h-[820px] shadow-2xl">
            <AIChatBox
              isMaximized={true}
              onToggleMaximize={() => setAiChatMaximized(false)}
              messages={aiMessages}
              loading={aiLoading}
              error={aiError}
              inputMessage={aiInputMessage}
              setInputMessage={setAiInputMessage}
              onSend={sendAiMessage}
              onKeyPress={handleAiKeyPress}
              onClear={handleClearChat}
              onCopy={handleCopyAnswer}
              copiedId={copiedMessageId}
              isTypingActive={Boolean(typingTimerRef.current)}
              onSkipTyping={() => typingTimerRef.current?.skip()}
              containerRef={modalChatContainerRef}
              messagesEndRef={modalAiMessagesEndRef}
              resource={resource}
              user={user}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AIChatBox({
  isMaximized,
  onToggleMaximize,
  messages,
  loading,
  error,
  inputMessage,
  setInputMessage,
  onSend,
  onKeyPress,
  onClear,
  onCopy,
  copiedId,
  isTypingActive,
  onSkipTyping,
  containerRef,
  messagesEndRef,
  resource,
  user,
}) {
  const suggestions = [
    {
      label: "Summarize Concepts",
      prompt: "Please summarize the core ideas and main takeaways of this material.",
    },
    {
      label: "Practice Questions",
      prompt: "Generate 3 high-yield practice exam questions based on this resource with explanations.",
    },
    {
      label: "Explain Hard Topics",
      prompt: "Explain the most challenging concepts in this material in a clear, intuitive way.",
    },
    {
      label: "Formula & Key Terms",
      prompt: "What are the essential formulas, rules, or definitions in this resource?",
    },
  ];

  return (
    <div
      className={`relative flex flex-col rounded-3xl border border-line/80 dark:border-dark-border/80 bg-gradient-to-b from-surface via-surface to-mist/30 dark:from-dark-surface dark:via-dark-surface dark:to-dark-bg/60 shadow-lg overflow-hidden transition-all duration-300 ${
        isMaximized ? "h-full w-full" : "h-[540px] sm:h-[580px] w-full"
      }`}
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-highland to-teal-400 opacity-90 z-10" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/60 dark:border-dark-border/60 px-4 py-3.5 bg-paper/90 dark:bg-dark-surface/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md shadow-highland/20">
            <Bot size={20} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-surface dark:ring-dark-surface"></span>
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-xs sm:text-sm text-ink dark:text-white flex items-center gap-1.5 truncate">
              AI Academic Tutor
              <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-muted dark:text-dark-muted truncate">
              {resource?.courseCode ? `${resource.courseCode} • ` : ""}
              {resource?.title || "Academic Resource"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-xl text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist/80 dark:hover:bg-dark-bg transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMaximize}
            className="p-2 rounded-xl text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist/80 dark:hover:bg-dark-bg transition-colors cursor-pointer"
            title={isMaximized ? "Exit focus mode" : "Expand to focus mode"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-highland/20 text-highland dark:text-emerald-400 border border-emerald-500/20 mx-auto shadow-sm">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-ink dark:text-white">
                How can I help you study?
              </p>
              <p className="text-xs text-muted dark:text-dark-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Ask questions about concepts, practice problems, or code from this material.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="pt-2 grid grid-cols-1 gap-2 text-left">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSend(s.prompt)}
                  className="rounded-xl border border-line/70 dark:border-dark-border/70 bg-paper/70 dark:bg-dark-surface/70 hover:border-highland/50 hover:bg-highland/5 p-2.5 text-xs text-ink/90 dark:text-dark-text/90 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="font-semibold">{s.label}</span>
                  <Send size={12} className="text-muted group-hover:text-highland transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id || message.content.slice(0, 15)}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? "max-w-[85%] rounded-tr-xs bg-gradient-to-tr from-highland to-emerald-600 text-white px-4 py-3 shadow-md"
                      : "w-full max-w-[95%] rounded-tl-xs border border-line/80 dark:border-dark-border/80 bg-surface dark:bg-dark-surface/95 shadow-sm p-4 text-ink dark:text-white space-y-2.5"
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between border-b border-line/40 dark:border-dark-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-highland dark:text-emerald-400">
                        <Bot size={14} />
                        <span>AI Study Tutor</span>
                        {message.isTyping && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold ml-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Typing answer...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {message.isTyping ? (
                          <button
                            type="button"
                            onClick={onSkipTyping}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Show entire response immediately"
                          >
                            <FastForward size={11} />
                            Skip
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCopy(message.content, message.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist dark:hover:bg-dark-bg transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check size={11} className="text-highland" />
                                <span className="text-highland">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <AIMessageContent
                      content={message.content}
                      isStreaming={message.isTyping}
                    />
                  )}
                </div>

                {/* Sub-label for user */}
                {isUser && (
                  <span className="mt-1 text-[10px] font-medium text-muted dark:text-dark-muted pr-1">
                    You
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Thinking Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-xs border border-line/70 dark:border-dark-border/70 bg-surface dark:bg-dark-surface p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-highland dark:text-emerald-400">
                <Bot size={15} />
                <span>AI Tutor is reviewing material...</span>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <div className="h-2 w-2 rounded-full bg-highland animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-highland animate-bounce [animation-delay:0.15s]" />
                <div className="h-2 w-2 rounded-full bg-highland animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 font-medium space-y-1">
            <p className="font-bold">Error receiving response</p>
            <p>{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Suggested chips above input if messages exist */}
      {messages.length > 0 && !loading && !isTypingActive && (
        <div className="px-4 py-2 border-t border-line/50 dark:border-dark-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-muted dark:text-dark-muted shrink-0">
            Suggested:
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSend(s.prompt)}
              className="shrink-0 rounded-full border border-line/60 bg-paper/80 px-2.5 py-0.5 text-[10px] font-medium text-ink/80 hover:border-highland hover:text-highland dark:border-dark-border/60 dark:bg-dark-bg/80 dark:text-dark-text/80 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Dock */}
      <div className="border-t border-line/60 dark:border-dark-border/60 p-3 bg-paper/80 dark:bg-dark-surface/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder={`Ask AI about ${resource?.courseCode || "this resource"}...`}
            className="flex-1 rounded-2xl border border-line/80 dark:border-dark-border/80 bg-surface px-4 py-3 text-xs sm:text-sm text-ink placeholder:text-muted focus:border-highland focus:ring-2 focus:ring-highland/20 dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted shadow-inner transition-all outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md shadow-highland/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
            title="Send question (Enter)"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="flex items-center justify-between px-1 pt-2 text-[10px] text-muted dark:text-dark-muted">
          <span>Press <strong>Enter ↵</strong> to send</span>
          <span>Powered by Gemini AI</span>
        </div>
      </div>
    </div>
  );
}

function BookMetaIcon(props) {
  return <BookOpen {...props} />;
}

