import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, ThumbsUp, ThumbsDown, Check, Search, Filter, Plus, ArrowLeft } from "lucide-react";
import api from "../api/client.js";

export default function QA() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/qa/questions");
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type, itemId, value) => {
    try {
      await api.post(`/qa/vote`, { type, itemId, value });
      fetchQuestions();
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.patch(`/qa/answers/${answerId}/accept`);
      fetchQuestions();
    } catch (error) {
      console.error("Failed to accept answer:", error);
    }
  };

  if (id) {
    return <QuestionDetail questionId={id} />;
  }

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <MessageSquare size={16} />
          Student Q&A
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Questions & Answers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Ask questions, share knowledge, and help fellow students with their academic queries.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-highland"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="select-field"
              >
                <option value="all">All Topics</option>
                <option value="mathematics">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="computer-science">Computer Science</option>
                <option value="engineering">Engineering</option>
              </select>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <Plus size={16} />
                Ask Question
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="empty-state py-12">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state py-12">No questions found. Be the first to ask!</div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                onClick={() => navigate(`/qa/${question.id}`)}
                className="section-panel rounded-xl p-5 cursor-pointer hover:border-highland/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-lg">{question.upvotes - question.downvotes}</span>
                    <span className="text-xs text-muted">votes</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink mb-2">{question.title}</h3>
                    <p className="text-sm text-muted mb-3 line-clamp-2">{question.body}</p>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>By {question.user.fullName}</span>
                      {question.university && <span>• {question.university.name}</span>}
                      <span>• {question._count.answers} answers</span>
                    </div>
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {question.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-mist rounded-full text-xs text-muted dark:bg-dark-border dark:text-dark-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showCreateModal && (
        <CreateQuestionModal onClose={() => setShowCreateModal(false)} onSuccess={fetchQuestions} />
      )}
    </div>
  );
}

function QuestionDetail({ questionId }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const [questionRes, answersRes] = await Promise.all([
        api.get(`/qa/questions/${questionId}`),
        api.get(`/qa/questions/${questionId}/answers`)
      ]);
      setQuestion(questionRes.data);
      setAnswers(answersRes.data);
    } catch (error) {
      console.error("Failed to fetch question:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/qa/questions/${questionId}/answers`, { body: newAnswer });
      setNewAnswer("");
      fetchQuestion();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  if (loading) {
    return (
      <div className="page-shell py-10">
        <div className="empty-state py-12">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10">
      <button onClick={() => navigate("/qa")} className="btn-secondary mb-6">
        <ArrowLeft size={16} />
        Back to Questions
      </button>

      <div className="section-panel rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-lg">{question.upvotes - question.downvotes}</span>
            <span className="text-xs text-muted">votes</span>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold text-ink mb-3">{question.title}</h1>
            <p className="text-ink mb-4">{question.body}</p>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span>By {question.user.fullName}</span>
              {question.university && <span>• {question.university.name}</span>}
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-mist rounded-full text-xs text-muted dark:bg-dark-border dark:text-dark-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-panel rounded-xl p-6">
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>
        <div className="space-y-4 mb-6">
          {answers.map((answer) => (
            <div key={answer.id} className="border border-line rounded-lg p-4">
              {answer.isAccepted && (
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <Check size={16} />
                  <span className="font-semibold">Accepted Answer</span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => handleVote("answer", answer.id, 1)} className="btn-ghost">
                    <ThumbsUp size={16} />
                  </button>
                  <span className="text-sm">{answer.upvotes - answer.downvotes}</span>
                  <button onClick={() => handleVote("answer", answer.id, -1)} className="btn-ghost">
                    <ThumbsDown size={16} />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-ink mb-2">{answer.body}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">By {answer.user.fullName}</span>
                    {!answer.isAccepted && (
                      <button onClick={() => handleAcceptAnswer(answer.id)} className="btn-secondary text-sm">
                        Accept Answer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitAnswer} className="space-y-4">
          <div>
            <label className="field-label">Your Answer</label>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="input-field min-h-32"
              placeholder="Share your knowledge..."
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Submit Answer
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateQuestionModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/qa/questions", {
        title,
        body,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create question:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-dark-surface">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4 dark:text-dark-text">Ask a Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="What's your question?"
              required
            />
          </div>
          <div>
            <label className="field-label">Details</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input-field min-h-32"
              placeholder="Provide more details about your question..."
              required
            />
          </div>
          <div>
            <label className="field-label">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="mathematics, physics, computer-science"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Posting..." : "Post Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
