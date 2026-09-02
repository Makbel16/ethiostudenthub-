import { useState, useEffect, useRef } from "react";
import { Bot, Send, MessageSquare, Trash2, Plus, Sparkles } from "lucide-react";
import api from "../api/client.js";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await api.get("/ai/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const fetchConversation = async (conversationId) => {
    try {
      const response = await api.get(`/ai/conversations/${conversationId}`);
      setCurrentConversation(response.data);
      setMessages(response.data.messages || []);
      setShowConversationList(false);
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError(null);

    try {
      setLoading(true);
      setMessages([...messages, { role: "user", content: userMessage }]);

      const response = await api.post("/ai/chat", {
        message: userMessage,
        conversationId: currentConversation?.id,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);

      if (response.data.conversationId) {
        setCurrentConversation({ id: response.data.conversationId });
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to get a response. Please try again.");
      setMessages([...messages, { role: "user", content: userMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await api.delete(`/ai/conversations/${conversationId}`);
      if (currentConversation?.id === conversationId) {
        startNewConversation();
      }
      fetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Sparkles size={16} />
          AI Study Assistant
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">AI Study Assistant</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Get help with your studies, career guidance, and academic questions powered by AI.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl overflow-hidden">
          <div className="flex border-b border-line">
            <button
              onClick={() => setShowConversationList(!showConversationList)}
              className="flex items-center gap-2 px-4 py-3 border-r border-line hover:bg-mist transition-colors dark:border-dark-border dark:hover:bg-dark-border"
            >
              <MessageSquare size={18} />
              <span className="font-semibold">Conversations</span>
              <span className="text-sm text-muted">({conversations.length})</span>
            </button>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-4 py-3 hover:bg-mist transition-colors dark:hover:bg-dark-border"
            >
              <Plus size={18} />
              <span className="font-semibold">New Chat</span>
            </button>
          </div>

          {showConversationList && (
            <div className="border-b border-line p-4 bg-mist/30 dark:border-dark-border dark:bg-dark-border/30">
              <h3 className="font-semibold text-ink mb-3">Your Conversations</h3>
              {loadingConversations ? (
                <div className="text-sm text-muted">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-muted">No conversations yet.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-line hover:border-highland/50 cursor-pointer dark:bg-dark-surface dark:border-dark-border"
                    >
                      <button
                        onClick={() => fetchConversation(conv.id)}
                        className="flex-1 text-left"
                      >
                        <span className="font-semibold text-ink">{conv.title}</span>
                        <span className="text-xs text-muted block">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteConversation(conv.id)}
                        className="btn-ghost text-ember p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <div className="min-h-96 max-h-96 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-highland/10 mb-4">
                    <Bot size={32} className="text-highland" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted max-w-md">
                    Ask me anything about your studies, career, or academic topics. I'm here to help you succeed!
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-highland text-white"
                          : "bg-mist text-ink dark:bg-dark-surface dark:text-dark-text"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === "assistant" && (
                          <Bot size={18} className="shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-mist rounded-2xl px-4 py-3 dark:bg-dark-surface">
                    <div className="flex items-center gap-2">
                      <Bot size={18} className="text-muted" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-muted rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-ember/10 border border-ember/30 rounded-2xl px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Bot size={18} className="text-ember shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-ember font-semibold text-sm">Error</p>
                        <p className="text-ember/80 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 input-field"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="btn-primary"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h3 className="font-semibold text-ink mb-3">Tips for better results</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>• Be specific with your questions</li>
            <li>• Provide context about your subject or topic</li>
            <li>• Ask follow-up questions to dive deeper</li>
            <li>• Use conversations to explore complex topics</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
