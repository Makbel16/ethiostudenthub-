import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  MessageSquare,
  Trash2,
  Plus,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Copy,
  Check,
  RotateCw,
  Search,
  Square,
  ArrowUp,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Code2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import api from "../api/client.js";
import AIOrb3D from "../components/3d/AIOrb3D.jsx";
import AIMessageContent from "../components/ai/AIMessageContent.jsx";

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: "Summarize Lecture Slide",
    prompt: "Can you summarize the core concepts of this topic in 5 bullet points with key definitions?",
    tag: "Study Aid",
  },
  {
    icon: GraduationCap,
    title: "Exam & Mid Practice",
    prompt: "Generate 5 challenging multiple-choice practice questions with detailed answer explanations for my mid-exam.",
    tag: "Exam Prep",
  },
  {
    icon: Lightbulb,
    title: "Explain Like I'm 5",
    prompt: "Explain a complex engineering or science concept simply using an everyday real-world analogy.",
    tag: "Concepts",
  },
  {
    icon: Code2,
    title: "Debug & Optimize Code",
    prompt: "Review this code snippet, explain potential bugs or bottlenecks, and rewrite it cleanly with time complexity.",
    tag: "Coding",
  },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);
  const abortTypingRef = useRef(false);
  const isAutoScrollActive = useRef(true);

  useEffect(() => {
    fetchConversations();
    // Default sidebar closed on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = (behavior = "smooth") => {
    if (!chatContainerRef.current || !isAutoScrollActive.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior,
    });
  };

  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Keep auto-scroll active if user is near bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollActive.current = atBottom;
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await api.get("/ai/conversations");
      setConversations(response.data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const startNewConversation = () => {
    stopTyping();
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setInputMessage("");
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const fetchConversation = async (conversationId) => {
    stopTyping();
    try {
      const response = await api.get(`/ai/conversations/${conversationId}`);
      setCurrentConversation(response.data);
      setMessages(response.data.messages || []);
      setError(null);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    }
  };

  const deleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${conversationId}`);
      if (currentConversation?.id === conversationId) {
        startNewConversation();
      }
      fetchConversations();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const stopTyping = () => {
    abortTypingRef.current = true;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
  };

  // Typewriter streaming effect
  const streamResponse = (fullText, messageIndex) => {
    stopTyping();
    abortTypingRef.current = false;
    setIsTyping(true);

    let charIndex = 0;
    // Speed dynamically adapts to length so long responses don't take forever
    const totalChars = fullText.length;
    const stepSize = totalChars > 800 ? 5 : totalChars > 400 ? 3 : 2;
    const delay = totalChars > 800 ? 10 : 16;

    const typeNext = () => {
      if (abortTypingRef.current) {
        // Instantly display full text if aborted
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = { ...updated[messageIndex], content: fullText };
          }
          return updated;
        });
        setIsTyping(false);
        return;
      }

      charIndex += stepSize;
      if (charIndex >= totalChars) {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = { ...updated[messageIndex], content: fullText };
          }
          return updated;
        });
        setIsTyping(false);
      } else {
        const partial = fullText.slice(0, charIndex);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex] = { ...updated[messageIndex], content: partial };
          }
          return updated;
        });
        typingTimerRef.current = setTimeout(typeNext, delay);
      }
    };

    typeNext();
  };

  const sendMessage = async (overrideText) => {
    const textToSend = (overrideText || inputMessage).trim();
    if (!textToSend || loading || isTyping) return;

    setInputMessage("");
    setError(null);
    isAutoScrollActive.current = true;

    // Optimistically push user message + blank assistant placeholder
    const nextMessages = [
      ...messages,
      { role: "user", content: textToSend },
    ];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        message: textToSend,
        conversationId: currentConversation?.id,
      });

      const fullReply = response.data.response || "No response received.";
      const assistantMessageIndex = nextMessages.length;

      // Add empty assistant slot and start typewriter
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
      setLoading(false);

      streamResponse(fullReply, assistantMessageIndex);

      if (response.data.conversationId) {
        if (!currentConversation) {
          setCurrentConversation({ id: response.data.conversationId });
        }
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const detail =
        err.response?.data?.error ||
        err.response?.data?.response ||
        err.response?.data?.message ||
        err.message ||
        "Failed to get a response. Please try again.";
      setError(detail);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-paper text-ink dark:bg-dark-bg dark:text-dark-text">
      {/* -------------------- SIDEBAR (ChatGPT style) -------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface/95 backdrop-blur-md transition-all duration-300 ease-in-out md:static dark:border-dark-border dark:bg-dark-surface ${
          sidebarOpen ? "w-72 translate-x-0" : "-translate-x-full md:w-0 md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-highland text-white shadow-sm shadow-highland/20">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none text-ink dark:text-white">
                EthioStudent AI
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-highland dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-highland animate-pulse" />
                Gemini 3.6 Flash
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted hover:bg-mist transition-colors md:hidden dark:hover:bg-dark-border"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewConversation}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink shadow-xs hover:border-highland hover:bg-highland/5 transition-all dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:border-highland"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} className="text-highland" />
              New Chat
            </span>
            <span className="text-[11px] font-mono text-muted dark:text-dark-muted">Ctrl+K</span>
          </button>
        </div>

        {/* Search Conversations */}
        {conversations.length > 3 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-mist/40 pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-highland focus:outline-hidden dark:border-dark-border dark:bg-dark-border/40 dark:text-dark-text"
              />
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {loadingConversations ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-mist/60 animate-pulse dark:bg-dark-border/40" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted">
              {searchQuery ? "No matching chats" : "No previous chats yet."}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = currentConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => fetchConversation(conv.id)}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition-all ${
                    isActive
                      ? "bg-highland/10 text-highland font-semibold dark:bg-highland/20 dark:text-emerald-300"
                      : "text-ink/80 hover:bg-mist hover:text-ink dark:text-dark-text/80 dark:hover:bg-dark-border/60 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <MessageSquare
                      size={15}
                      className={isActive ? "text-highland shrink-0" : "text-muted shrink-0"}
                    />
                    <span className="truncate">{conv.title || "Untitled Chat"}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(e, conv.id)}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-ember transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-line p-3 text-[11px] text-muted dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-highland" />
            <span>Encrypted AI Workspace</span>
          </div>
          <span>v2.4</span>
        </div>
      </aside>

      {/* -------------------- MAIN CHAT CONTAINER -------------------- */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-line px-4 bg-surface/80 backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/80">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-muted hover:bg-mist transition-colors dark:hover:bg-dark-border"
                title="Open sidebar"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-ink dark:text-white truncate max-w-xs md:max-w-md">
                {currentConversation?.title || "New Study Chat"}
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md border border-highland/30 bg-highland/10 px-2 py-0.5 text-[10px] font-semibold text-highland dark:bg-highland/20 dark:text-emerald-300">
                Gemini 3.6 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-mist transition-colors dark:border-dark-border dark:hover:bg-dark-border"
              title="Start a new chat"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Messages Stream Area (Internal Scroller Only) */}
        <div
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {/* EMPTY STATE: 3D Orb + ChatGPT-style Welcome */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 md:py-12 text-center animate-fade-in-up">
                {/* 3D Interactive AI Core */}
                <div className="mb-4">
                  <AIOrb3D isTyping={loading || isTyping} size={190} />
                </div>

                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-highland/30 bg-highland/10 px-3.5 py-1 text-xs font-semibold text-highland dark:bg-highland/20 dark:text-emerald-300 shadow-xs">
                  <Sparkles size={14} />
                  Ethiopian University AI Study Companion
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink dark:text-white">
                  How can I help your studies today?
                </h1>
                <p className="mt-2.5 max-w-lg text-sm text-muted leading-relaxed dark:text-dark-muted">
                  Ask exam questions, get lecture summaries, debug programming code, or explore
                  complex academic concepts with intelligent guidance.
                </p>

                {/* 4 Suggestion Cards */}
                <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                  {SUGGESTIONS.map((sug, i) => {
                    const Icon = sug.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => sendMessage(sug.prompt)}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-highland hover:shadow-md dark:border-dark-border dark:bg-dark-surface dark:hover:border-highland/60"
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-highland/10 text-highland group-hover:bg-highland group-hover:text-white transition-colors dark:bg-highland/20">
                            <Icon size={16} />
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                            {sug.tag}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-ink group-hover:text-highland transition-colors dark:text-white">
                          {sug.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                          {sug.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MESSAGES LIST */}
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isLastAssistant =
                !isUser && index === messages.length - 1 && isTyping;

              return (
                <div
                  key={index}
                  className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-highland to-emerald-600 text-white shadow-sm shadow-highland/20 mt-0.5">
                      <Bot size={17} />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-2xl ${
                      isUser
                        ? "rounded-2xl rounded-tr-sm bg-highland px-4 py-3 text-white shadow-xs"
                        : "rounded-2xl border border-line bg-surface px-5 py-4 text-ink shadow-xs dark:border-dark-border dark:bg-dark-surface dark:text-dark-text w-full"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      <>
                        <AIMessageContent
                          content={message.content}
                          isStreaming={isLastAssistant}
                        />

                        {/* Action Toolbar on Assistant Messages */}
                        {!isLastAssistant && message.content && (
                          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-xs text-muted dark:border-dark-border">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyMessage(message.content, index)}
                                className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-mist hover:text-ink transition-colors dark:hover:bg-dark-border"
                                title="Copy response"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check size={13} className="text-highland" />
                                    <span className="text-highland text-[11px]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span className="text-[11px]">Copy</span>
                                  </>
                                )}
                              </button>

                              {index === messages.length - 1 && (
                                <button
                                  onClick={handleRegenerate}
                                  className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-mist hover:text-ink transition-colors dark:hover:bg-dark-border"
                                  title="Regenerate response"
                                >
                                  <RotateCw size={13} />
                                  <span className="text-[11px]">Retry</span>
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-muted">EthioStudent AI</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* THINKING INDICATOR */}
            {loading && (
              <div className="flex items-center gap-3 animate-fade-in-up">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-highland text-white">
                  <Bot size={17} />
                </div>
                <div className="rounded-2xl border border-line bg-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="inline-block h-2 w-2 rounded-full bg-highland animate-ping" />
                    <span>Thinking with Gemini 3.6 Flash...</span>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR BANNER */}
            {error && (
              <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm text-ember dark:border-ember/40 dark:bg-ember/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-semibold text-xs uppercase tracking-wide">Error</h5>
                    <p className="mt-1 text-xs leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs font-semibold underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="h-6" />
          </div>
        </div>

        {/* -------------------- BOTTOM FLOATING DOCK (ChatGPT Style) -------------------- */}
        <div className="border-t border-line/60 bg-gradient-to-t from-surface via-surface/95 to-transparent px-4 pb-4 pt-2 dark:border-dark-border/60 dark:from-dark-surface dark:via-dark-surface/95">
          <div className="mx-auto max-w-3xl">
            {/* Input Card */}
            <div className="relative flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-md transition-all focus-within:border-highland focus-within:ring-2 focus-within:ring-highland/15 dark:border-dark-border dark:bg-dark-bg">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your courses, research, or exams..."
                disabled={loading}
                className="max-h-44 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-hidden dark:text-dark-text"
              />

              <div className="flex items-center gap-1.5 pb-1 pr-1">
                {isTyping ? (
                  <button
                    onClick={stopTyping}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-white shadow-xs hover:bg-ember/90 transition-all"
                    title="Stop generating"
                  >
                    <Square size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !inputMessage.trim()}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                      inputMessage.trim() && !loading
                        ? "bg-highland text-white shadow-xs hover:bg-highland-dark active:scale-95"
                        : "bg-mist text-muted cursor-not-allowed dark:bg-dark-border dark:text-dark-muted"
                    }`}
                    title="Send message"
                  >
                    <ArrowUp size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-2 text-center text-[11px] text-muted dark:text-dark-muted">
              EthioStudentHub AI can make mistakes. Verify important academic and university information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
