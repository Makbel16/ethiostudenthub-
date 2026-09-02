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
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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
  const extension = getFileExtension(resource.fileUrl);

  if ([".jpg", ".jpeg", ".png"].includes(extension)) return "image";
  if (extension === ".mp4" || resource.type === "VIDEO") return "video";
  if (extension === ".pdf") return "document";
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
  const aiMessagesEndRef = useRef(null);

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

  const preview = useQuery({
    queryKey: ["resource-preview", id],
    queryFn: async () => {
      const response = await api.get(`/resources/${id}/open`, { responseType: "blob" });
      return URL.createObjectURL(response.data);
    },
    enabled: Boolean(user && resource && !isUsefulLinkResource && getPreviewKind(resource)),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    const previewUrl = preview.data;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [preview.data]);

  // AI Chat functions
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const sendAiMessage = async () => {
    if (!aiInputMessage.trim()) return;

    const userMessage = aiInputMessage.trim();
    setAiInputMessage("");
    setAiError(null);

    try {
      setAiLoading(true);
      setAiMessages([...aiMessages, { role: "user", content: userMessage }]);

      const response = await api.post("/ai/chat", {
        message: userMessage,
        context: `About resource: ${resource?.title}. ${resource?.description || ""}`,
      });

      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      console.error("Failed to send AI message:", error);
      setAiError("Failed to get a response. Please try again.");
      setAiMessages([...aiMessages, { role: "user", content: userMessage }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
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
    if (!user) return;

    setFileActionError("");
    setIsOpeningFile(true);

    const openedWindow = window.open("", "_blank");
    if (openedWindow) {
      openedWindow.document.title = "Opening file";
      openedWindow.opener = null;
    }

    try {
      let blobUrl = preview.data;
      let shouldRevoke = false;

      if (!blobUrl) {
        const response = await api.get(`/resources/${id}/open`, { responseType: "blob" });
        blobUrl = URL.createObjectURL(response.data);
        shouldRevoke = true;
      }

      if (openedWindow) {
        openedWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }

      if (shouldRevoke) setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      if (openedWindow) openedWindow.close();
      setFileActionError(err.response?.data?.error || "Could not open this file. Please log in again and retry.");
    } finally {
      setIsOpeningFile(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!user) return;

    setFileActionError("");
    setIsDownloadingFile(true);

    try {
      const response = await api.get(`/resources/${id}/download`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = getFilenameFromDisposition(response.headers["content-disposition"], resource.title);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      setTimeout(invalidate, 800);
    } catch (err) {
      setFileActionError(err.response?.data?.error || "Could not download this file. Please log in again and retry.");
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

          {user && previewKind && (
            <section className="mt-10 border-t border-line pt-8">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text">File preview</h2>
                <button type="button" onClick={handleOpenFile} disabled={isOpeningFile} className="btn-secondary">
                  <ExternalLink size={16} />
                  {isOpeningFile ? "Opening..." : "Open in new tab"}
                </button>
              </div>

              {preview.isLoading && <div className="empty-state">Loading file preview...</div>}
              {preview.isError && <div className="empty-state">Could not load the file preview.</div>}
              {preview.data && (
                <div className="overflow-hidden rounded-lg border border-line bg-paper dark:bg-dark-surface dark:border-dark-border">
                  {previewKind === "image" && (
                    <img src={preview.data} alt={resource.title} className="max-h-[70vh] w-full bg-white object-contain dark:bg-dark-surface" />
                  )}
                  {previewKind === "video" && (
                    <video src={preview.data} controls preload="metadata" className="aspect-video w-full bg-black" />
                  )}
                  {previewKind === "document" && (
                    <iframe
                      src={preview.data}
                      title={`${resource.title} file preview`}
                      className="h-[100vh] min-h-[420px] w-full bg-white dark:bg-dark-surface"
                    />
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
            ) : user ? (
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
            ) : (
              <div className="rounded-lg border border-line bg-paper p-4 text-center">
                <p className="text-sm leading-6 text-muted dark:text-dark-muted">Log in to open or download this file.</p>
                <Link to="/login" className="btn-dark mt-3 w-full">
                  Log in
                </Link>
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

          {user && (
            <div className="rounded-xl border border-highland/20 bg-gradient-to-br from-highland/10 to-highland/5 p-5 dark:from-highland/20 dark:to-highland/10 dark:border-highland/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-highland to-highland-dark text-white shadow-lg">
                  <Bot size={24} />
                </div>
                <div>
                  <p className="font-semibold text-highland-dark dark:text-highland-light text-base">AI Study Assistant</p>
                  <p className="mt-0.5 text-xs text-highland-dark/75 dark:text-highland-light/75">Ask about this resource</p>
                </div>
              </div>
              
              <div className="mb-4 max-h-80 overflow-y-auto space-y-3 rounded-lg bg-white/50 dark:bg-dark-surface/50 p-3">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-highland/10 mx-auto mb-3">
                      <Bot size={28} className="text-highland" />
                    </div>
                    <p className="text-sm font-medium text-highland-dark dark:text-highland-light mb-1">
                      Ask a question about this material
                    </p>
                    <p className="text-xs text-highland-dark/60 dark:text-highland-light/60">
                      I can help explain concepts, summarize content, or answer questions about this resource.
                    </p>
                  </div>
                ) : (
                  aiMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-full rounded-2xl px-4 py-3 text-sm ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-highland to-highland-dark text-white shadow-md"
                            : "bg-white text-ink shadow-sm dark:bg-dark-surface dark:text-dark-text"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === "assistant" && (
                            <Bot size={16} className="shrink-0 mt-0.5 text-highland" />
                          )}
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 text-sm shadow-sm dark:bg-dark-surface">
                      <div className="flex items-center gap-2">
                        <Bot size={16} className="text-highland" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-highland rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-highland rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-highland rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {aiError && (
                  <div className="flex justify-start">
                    <div className="bg-ember/10 border border-ember/30 rounded-2xl px-4 py-3 text-sm">
                      <p className="text-ember font-medium">{aiError}</p>
                    </div>
                  </div>
                )}
                <div ref={aiMessagesEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInputMessage}
                  onChange={(e) => setAiInputMessage(e.target.value)}
                  onKeyPress={handleAiKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-xl border border-highland/30 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-highland focus:ring-2 focus:ring-highland/20 dark:bg-dark-surface dark:border-highland/40 dark:text-dark-text dark:placeholder:text-dark-muted shadow-sm"
                  disabled={aiLoading}
                />
                <button
                  onClick={sendAiMessage}
                  disabled={aiLoading || !aiInputMessage.trim()}
                  className="btn-primary px-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function BookMetaIcon(props) {
  return <BookOpen {...props} />;
}
