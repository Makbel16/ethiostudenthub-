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
  CheckCircle2,
  Maximize2,
  Minimize2,
  FastForward,
  Mail,
  History,
  MessageSquare,
  X,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AIMessageContent from "../components/ai/AIMessageContent.jsx";

const getInitials = (name = "") => {
  const parts = String(name || "").trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name[0] || "U").toUpperCase();
};

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

  // Load saved chat history for this specific resource topic
  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(`ethio_ai_chat_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiMessages(parsed.map((m) => ({ ...m, isTyping: false })));
        }
      }
    } catch (e) {
      console.error("Failed to load local chat history:", e);
    }
  }, [id]);

  // Persist messages whenever they change
  useEffect(() => {
    if (!id || aiMessages.length === 0) return;
    try {
      const cleanMessages = aiMessages
        .filter((m) => !m.isTyping)
        .slice(-30);
      if (cleanMessages.length > 0) {
        localStorage.setItem(`ethio_ai_chat_${id}`, JSON.stringify(cleanMessages));
      }
    } catch (e) {
      console.error("Failed to save local chat history:", e);
    }
  }, [id, aiMessages]);

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
    // Medium, comfortable and readable typing cadence (~32-35 chars/sec)
    // 1 character every 30ms gives a smooth, readable flow without rushing
    const step = 1;
    const speed = 30;

    let tickCount = 0;
    const timer = setInterval(() => {
      currentIndex += step;
      tickCount++;
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
        // Throttle scrolling to every 4 ticks (~120ms) to prevent any layout thrashing
        if (tickCount % 4 === 0) {
          scrollToBottom(false);
        }
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

    // Auto-scroll down immediately inside the chat box when user clicks send!
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
    try {
      localStorage.removeItem(`ethio_ai_chat_${id}`);
    } catch {}
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
        <AIExpandedModal
          onClose={() => setAiChatMaximized(false)}
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
      )}
    </div>
  );
}

function AIChatBox({
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
  const [showTopicHistory, setShowTopicHistory] = useState(false);
  const userQuestions = messages.filter((m) => m.role === "user");

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
    <div className="relative flex flex-col rounded-3xl border border-line/80 dark:border-dark-border/80 bg-gradient-to-b from-surface via-surface to-mist/30 dark:from-dark-surface dark:via-dark-surface dark:to-dark-bg/60 shadow-lg overflow-hidden transition-all duration-300 h-[540px] sm:h-[580px] w-full">
      {/* Top Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-highland to-teal-400 opacity-90 z-10" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/60 dark:border-dark-border/60 px-4 py-3 bg-paper/90 dark:bg-dark-surface/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md shadow-highland/20">
            <Bot size={20} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-surface dark:ring-dark-surface"></span>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-bold text-xs sm:text-sm text-ink dark:text-white truncate">
                AI Academic Tutor
              </h3>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Gemini
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted dark:text-dark-muted truncate mt-0.5">
              {user?.email ? (
                <span className="inline-flex items-center gap-1 font-mono truncate text-[10px] text-ink/90 dark:text-white/90 font-medium bg-mist/80 dark:bg-dark-bg/80 px-2 py-0.5 rounded-md border border-line/60 dark:border-dark-border/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <Mail size={10} className="text-highland shrink-0" />
                  <span className="truncate max-w-[155px]">{user.email}</span>
                </span>
              ) : (
                <span className="truncate">Ask anything about this resource</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {userQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTopicHistory((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                showTopicHistory
                  ? "bg-highland text-white shadow-sm shadow-highland/30"
                  : "text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist/80 dark:hover:bg-dark-bg border border-line/60 dark:border-dark-border/60"
              }`}
              title="Toggle your topic question history"
            >
              <History size={13} />
              <span className="rounded-full bg-paper/40 dark:bg-dark-surface/50 px-1.5 text-[10px] font-bold">
                {userQuestions.length}
              </span>
            </button>
          )}

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
            className="p-2 rounded-xl text-highland dark:text-emerald-400 hover:bg-highland/10 dark:hover:bg-emerald-500/10 border border-highland/20 transition-colors cursor-pointer"
            title="Expand to Full Study Studio"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Quick Collapsed Topic History Flyout */}
      {showTopicHistory && (
        <div className="border-b border-line/70 dark:border-dark-border/70 bg-paper/95 dark:bg-dark-bg/95 p-3 space-y-2 animate-in slide-in-from-top duration-200 z-10 max-h-48 overflow-y-auto overscroll-contain shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-ink dark:text-white">
            <span className="flex items-center gap-1.5 text-highland">
              <History size={13} />
              Questions on this Topic ({userQuestions.length})
            </span>
            <button
              type="button"
              onClick={() => setShowTopicHistory(false)}
              className="text-[11px] text-muted hover:text-ink dark:hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <div className="space-y-1.5">
            {userQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSend(q.content);
                  setShowTopicHistory(false);
                }}
                className="w-full text-left rounded-xl border border-line/50 dark:border-dark-border/50 bg-surface/80 dark:bg-dark-surface/80 hover:border-highland/50 hover:bg-highland/5 p-2 text-xs text-ink/90 dark:text-dark-text/90 truncate transition-colors flex items-center gap-2 group cursor-pointer"
                title={`Ask again: "${q.content}"`}
              >
                <MessageSquare size={12} className="text-muted group-hover:text-highland shrink-0" />
                <span className="truncate">{q.content}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
          <span>Press <strong className="text-ink dark:text-white">Enter ↵</strong> to send</span>
          {user?.email && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted dark:text-dark-muted truncate max-w-[190px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Mail size={9} className="text-highland shrink-0" />
              <strong className="text-ink dark:text-white truncate">{user.email}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AIExpandedModal({
  onClose,
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
  const [mobileTab, setMobileTab] = useState("chat"); // "chat" | "history"
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const suggestions = [
    {
      label: "Summarize Core Concepts",
      prompt: "Please summarize the core ideas, principles, and key takeaways of this material.",
    },
    {
      label: "3 Practice Exam Questions",
      prompt: "Generate 3 high-yield practice exam questions based on this resource with complete explanations.",
    },
    {
      label: "Explain Hardest Topics",
      prompt: "Explain the most challenging concepts in this material in a clear, intuitive way.",
    },
    {
      label: "Formula & Key Terms",
      prompt: "What are the essential formulas, rules, or definitions in this resource that I should memorize?",
    },
  ];

  // User questions history on this specific topic
  const userQuestions = messages.filter((m) => m.role === "user");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[880px] rounded-3xl overflow-hidden border border-line/80 dark:border-dark-border bg-surface dark:bg-dark-surface shadow-2xl flex flex-col">
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-highland to-teal-400 opacity-90 z-20" />

        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-line/60 dark:border-dark-border/60 px-4 sm:px-6 py-3.5 bg-paper/95 dark:bg-dark-surface/95 backdrop-blur-sm z-10 gap-3">
          {/* Left: Bot Icon + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md shadow-highland/20">
              <Bot size={22} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-surface dark:ring-dark-surface"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-sm sm:text-base text-ink dark:text-white flex items-center gap-1.5">
                  AI Academic Study Studio
                  <Sparkles size={14} className="text-amber-500" />
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-muted dark:text-dark-muted truncate mt-0.5">
                {resource?.courseCode ? `${resource.courseCode} • ` : ""}
                {resource?.title || "Academic Material"}
              </p>
            </div>
          </div>

          {/* Center (Mobile Only Switcher) */}
          <div className="flex md:hidden items-center bg-paper/80 dark:bg-dark-bg/80 p-0.5 rounded-xl border border-line/60 dark:border-dark-border/60 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                mobileTab === "chat"
                  ? "bg-highland text-white shadow-sm"
                  : "text-muted dark:text-dark-muted"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("history")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                mobileTab === "history"
                  ? "bg-highland text-white shadow-sm"
                  : "text-muted dark:text-dark-muted"
              }`}
            >
              <History size={12} />
              <span>History ({userQuestions.length})</span>
            </button>
          </div>

          {/* Right Header: Logged-in User Email Badge + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user?.email && (
              <div
                onClick={() => handleCopyEmail(user.email)}
                className="hidden lg:flex items-center gap-2 rounded-xl bg-paper px-3 py-1.5 border border-line/70 dark:border-dark-border/70 text-xs font-mono text-ink dark:text-white shadow-sm hover:border-highland/50 transition-colors cursor-pointer"
                title="Click to copy logged-in email"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-highland/10 text-highland shrink-0">
                  <Mail size={12} />
                </div>
                <span className="truncate max-w-[180px] font-semibold">{user.email}</span>
                {copiedEmail ? (
                  <Check size={12} className="text-highland shrink-0" />
                ) : (
                  <Copy size={11} className="text-muted shrink-0" />
                )}
              </div>
            )}

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-red-500 hover:bg-red-500/10 border border-line/60 dark:border-dark-border/60 transition-colors cursor-pointer"
                title="Clear current conversation"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist dark:hover:bg-dark-bg border border-line/60 dark:border-dark-border/60 transition-colors cursor-pointer"
              title="Close expanded mode (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Studio Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* LEFT PANEL: TOPIC CONTEXT, LOGGED-IN EMAIL, & TOPIC CHAT HISTORY */}
          {/* ========================================================================= */}
          <div
            className={`${
              mobileTab === "history" ? "flex" : "hidden"
            } md:flex md:col-span-4 lg:col-span-4 border-r border-line/60 dark:border-dark-border/60 bg-paper/50 dark:bg-dark-bg/50 p-4 sm:p-5 flex-col justify-between overflow-y-auto space-y-4 overscroll-contain`}
          >
            <div className="space-y-4">
              {/* Logged-In User Profile Card */}
              <div className="rounded-2xl border border-line/80 dark:border-dark-border/80 bg-gradient-to-br from-surface to-paper dark:from-dark-surface dark:to-dark-bg p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-highland/10 to-transparent rounded-bl-full pointer-events-none" />

                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white font-bold text-sm shadow-md shadow-highland/20 ring-2 ring-highland/30">
                      {getInitials(user?.fullName || "Student")}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-dark-surface"></span>
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-ink dark:text-white truncate">
                        {user?.fullName || "Student Scholar"}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {user?.role || "STUDENT"}
                      </span>
                    </div>

                    {/* Logged-in Email with Copy Action */}
                    <div className="mt-1.5 flex items-center justify-between gap-1 rounded-xl bg-paper/80 dark:bg-dark-bg/80 border border-line/60 dark:border-dark-border/60 px-2.5 py-1">
                      <div className="flex items-center gap-1.5 min-w-0 text-muted dark:text-dark-muted font-mono text-[11px]">
                        <Mail size={12} className="text-highland shrink-0" />
                        <span
                          className="truncate text-ink dark:text-white font-medium"
                          title={user?.email || "student@ethiostudenthub.com"}
                        >
                          {user?.email || "student@ethiostudenthub.com"}
                        </span>
                      </div>
                      {user?.email && (
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(user.email)}
                          className="shrink-0 p-1 text-muted hover:text-highland dark:text-dark-muted dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Copy logged-in email"
                        >
                          {copiedEmail ? (
                            <Check size={12} className="text-highland" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted dark:text-dark-muted font-medium">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      <span>Authenticated Academic Session</span>
                      {copiedEmail && (
                        <span className="text-highland font-bold ml-auto animate-in fade-in">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Topic Card */}
              <div className="rounded-2xl border border-line/70 dark:border-dark-border/70 bg-surface/80 dark:bg-dark-surface/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted dark:text-dark-muted">
                    Studying Material
                  </span>
                  {resource?.courseCode && (
                    <span className="font-mono text-[11px] font-extrabold text-highland bg-highland/10 px-2.5 py-0.5 rounded-md border border-highland/20">
                      {resource.courseCode}
                    </span>
                  )}
                </div>
                <h4 className="font-display text-xs sm:text-sm font-bold text-ink dark:text-white leading-snug line-clamp-2">
                  {resource?.title}
                </h4>
                {resource?.university?.name && (
                  <p className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1.5">
                    <Building2 size={12} className="text-highland shrink-0" />
                    <span className="truncate">{resource.university.name}</span>
                  </p>
                )}
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted dark:text-dark-muted">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Topic memory active: local chat preserved</span>
                </div>
              </div>

              {/* Topic Chat History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-muted dark:text-dark-muted flex items-center gap-1.5">
                    <History size={13} className="text-highland" />
                    <span>Topic History ({userQuestions.length})</span>
                  </span>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear chat history on this topic"
                    >
                      <RotateCcw size={10} />
                      Clear History
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-muted dark:text-dark-muted">
                  Saved questions on <strong className="text-ink dark:text-white">{resource?.courseCode || "this material"}</strong>:
                </p>

                {userQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line/80 dark:border-dark-border/80 p-4 text-center space-y-1.5 bg-paper/30 dark:bg-dark-bg/30">
                    <MessageSquare size={18} className="mx-auto text-muted/60" />
                    <p className="text-xs font-semibold text-ink dark:text-white">No questions yet</p>
                    <p className="text-[11px] text-muted dark:text-dark-muted">
                      Your questions about this topic will appear here for one-click review.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto space-y-2 max-h-52 pr-1 overscroll-contain">
                    {userQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onSend(q.content);
                          if (mobileTab === "history") setMobileTab("chat");
                        }}
                        className="w-full text-left rounded-2xl border border-line/60 dark:border-dark-border/60 bg-surface/80 dark:bg-dark-surface/80 hover:bg-highland/5 hover:border-highland/50 p-2.5 text-xs text-ink/90 dark:text-dark-text/90 transition-all flex items-start gap-2.5 group cursor-pointer shadow-xs hover:shadow-sm"
                        title={`Ask again: "${q.content}"`}
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-highland/10 text-highland group-hover:bg-highland group-hover:text-white transition-colors mt-0.5 text-[10px] font-bold">
                          Q{idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-xs group-hover:text-highland transition-colors">
                            {q.content}
                          </p>
                          <span className="text-[10px] text-muted dark:text-dark-muted flex items-center gap-1 mt-0.5">
                            <span>Click to re-ask</span>
                            <Send size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-highland" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Study Shortcuts */}
            <div className="pt-3 border-t border-line/60 dark:border-dark-border/60 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted dark:text-dark-muted">
                Study Shortcuts
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSend(s.prompt);
                      if (mobileTab === "history") setMobileTab("chat");
                    }}
                    className="rounded-xl border border-line/60 dark:border-dark-border/60 bg-surface/70 dark:bg-dark-surface/70 hover:border-highland/40 hover:bg-highland/5 p-2 text-xs text-ink/90 dark:text-dark-text/90 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-semibold text-[11px] truncate">{s.label}</span>
                    <Send size={11} className="text-muted group-hover:text-highland shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANEL: MAIN CHAT CANVAS */}
          {/* ========================================================================= */}
          <div
            className={`${
              mobileTab === "chat" ? "flex" : "hidden"
            } md:flex md:col-span-8 lg:col-span-8 flex-col h-full bg-surface dark:bg-dark-surface min-h-0`}
          >
            {/* Message Stream */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth overscroll-contain"
            >
              {messages.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-highland/20 to-teal-500/20 text-highland dark:text-emerald-400 border border-emerald-500/25 mx-auto shadow-md">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-ink dark:text-white">
                      Ask anything about this resource
                    </h4>
                    <p className="text-xs sm:text-sm text-muted dark:text-dark-muted mt-1 leading-relaxed">
                      Your AI tutor has indexed <strong className="text-ink dark:text-white font-semibold">{resource?.title}</strong>. Ask for full conceptual explanations, formulas, or practice quiz questions.
                    </p>
                  </div>
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSend(s.prompt)}
                        className="rounded-2xl border border-line/70 dark:border-dark-border/70 bg-paper/60 dark:bg-dark-bg/60 hover:border-highland/50 hover:bg-highland/5 p-3 text-xs text-ink/90 dark:text-dark-text/90 transition-all flex items-center justify-between group cursor-pointer"
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
                      {/* Bubble */}
                      <div
                        className={`rounded-3xl text-xs sm:text-sm leading-relaxed transition-all ${
                          isUser
                            ? "max-w-[85%] rounded-tr-xs bg-gradient-to-tr from-highland to-emerald-600 text-white px-4 py-3 shadow-md"
                            : "w-full max-w-[95%] rounded-tl-xs border border-line/80 dark:border-dark-border/80 bg-paper/90 dark:bg-dark-bg/90 shadow-sm p-4 sm:p-5 text-ink dark:text-white space-y-2.5"
                        }`}
                      >
                        {!isUser && (
                          <div className="flex items-center justify-between border-b border-line/40 dark:border-dark-border/40 pb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-highland dark:text-emerald-400">
                              <Bot size={15} />
                              <span>AI Academic Tutor</span>
                              {message.isTyping && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-semibold ml-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Typing answer...
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {message.isTyping ? (
                                <button
                                  type="button"
                                  onClick={onSkipTyping}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                                  title="Show entire response immediately"
                                >
                                  <FastForward size={11} />
                                  Skip
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onCopy(message.content, message.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white hover:bg-mist dark:hover:bg-dark-bg border border-line/50 dark:border-dark-border/50 transition-colors cursor-pointer"
                                  title="Copy response"
                                >
                                  {copiedId === message.id ? (
                                    <>
                                      <Check size={12} className="text-highland" />
                                      <span className="text-highland">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <AIMessageContent
                            content={message.content}
                            isStreaming={message.isTyping}
                          />
                        )}
                      </div>

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
                  <div className="rounded-3xl rounded-tl-xs border border-line/70 dark:border-dark-border/70 bg-paper dark:bg-dark-bg p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-highland dark:text-emerald-400">
                      <Bot size={15} />
                      <span>Reviewing material and drafting response...</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-1">
                      <div className="h-2 w-2 rounded-full bg-highland animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-highland animate-bounce [animation-delay:0.15s]" />
                      <div className="h-2 w-2 rounded-full bg-highland animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Suggested Chips Bar */}
            {messages.length > 0 && !loading && !isTypingActive && (
              <div className="px-5 py-2 border-t border-line/50 dark:border-dark-border/50 flex items-center gap-2 overflow-x-auto no-scrollbar bg-paper/30 dark:bg-dark-bg/30">
                <span className="text-[10px] uppercase font-bold text-muted dark:text-dark-muted shrink-0">
                  Follow-up:
                </span>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSend(s.prompt)}
                    className="shrink-0 rounded-full border border-line/60 bg-paper/80 px-3 py-1 text-xs font-medium text-ink/80 hover:border-highland hover:text-highland dark:border-dark-border/60 dark:bg-dark-bg/80 dark:text-dark-text/80 transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Dock */}
            <div className="border-t border-line/60 dark:border-dark-border/60 p-4 bg-paper/80 dark:bg-dark-surface/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={onKeyPress}
                  placeholder={`Ask anything about ${resource?.courseCode || "this material"}...`}
                  className="flex-1 rounded-2xl border border-line/80 dark:border-dark-border/80 bg-surface px-5 py-3.5 text-sm text-ink placeholder:text-muted focus:border-highland focus:ring-2 focus:ring-highland/20 dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted shadow-inner transition-all outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-highland to-emerald-600 text-white shadow-md shadow-highland/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  title="Send question (Enter)"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="flex items-center justify-between px-2 pt-2.5 text-[11px] text-muted dark:text-dark-muted">
                <span>
                  Press <strong className="text-ink dark:text-white">Enter ↵</strong> to send
                </span>
                {user?.email && (
                  <span className="font-mono text-[10px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Logged in:</span>
                    <strong className="text-ink dark:text-white">{user.email}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookMetaIcon(props) {
  return <BookOpen {...props} />;
}

