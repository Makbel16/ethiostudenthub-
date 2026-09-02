import { useState, useEffect } from "react";
import { Sparkles, BookOpen, MessageSquare, Briefcase, TrendingUp } from "lucide-react";
import api from "../api/client.js";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/recommendations");
      setRecommendations(response.data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell py-10">
        <div className="empty-state py-12">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Sparkles size={16} />
          Personalized Recommendations
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Recommended For You</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Discover resources, questions, and opportunities tailored to your academic profile and interests.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="flex gap-2">
            {[
              { id: "all", label: "All", icon: Sparkles },
              { id: "resources", label: "Resources", icon: BookOpen },
              { id: "questions", label: "Questions", icon: MessageSquare },
              { id: "opportunities", label: "Opportunities", icon: Briefcase },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-highland text-white"
                    : "bg-mist text-muted hover:bg-mist/80"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === "all" || activeTab === "resources") && (
          <div className="section-panel rounded-xl p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-highland" />
              Recommended Resources
            </h2>
            {recommendations?.resources?.length > 0 ? (
              <div className="grid gap-4">
                {recommendations.resources.map((resource) => (
                  <div key={resource.id} className="border border-line rounded-lg p-4 hover:border-highland/50 transition-colors">
                    <h3 className="font-semibold text-ink mb-2">{resource.title}</h3>
                    <p className="text-sm text-muted mb-3 line-clamp-2">{resource.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      {resource.university && <span>{resource.university.name}</span>}
                      {resource.department && <span>• {resource.department.name}</span>}
                      <span>• {resource.downloadCount} downloads</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">No resource recommendations yet.</div>
            )}
          </div>
        )}

        {(activeTab === "all" || activeTab === "questions") && (
          <div className="section-panel rounded-xl p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-amber-600" />
              Recommended Questions
            </h2>
            {recommendations?.questions?.length > 0 ? (
              <div className="grid gap-4">
                {recommendations.questions.map((question) => (
                  <div key={question.id} className="border border-line rounded-lg p-4 hover:border-highland/50 transition-colors">
                    <h3 className="font-semibold text-ink mb-2">{question.title}</h3>
                    <p className="text-sm text-muted mb-3 line-clamp-2">{question.body}</p>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>By {question.user.fullName}</span>
                      {question.university && <span>• {question.university.name}</span>}
                      <span>• {question._count.answers} answers</span>
                      <span>• {question.upvotes} upvotes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">No question recommendations yet.</div>
            )}
          </div>
        )}

        {(activeTab === "all" || activeTab === "opportunities") && (
          <div className="section-panel rounded-xl p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-green-600" />
              Recommended Opportunities
            </h2>
            {recommendations?.opportunities?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendations.opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="border border-line rounded-lg p-4 hover:border-highland/50 transition-colors">
                    <h3 className="font-semibold text-ink mb-2">{opportunity.title}</h3>
                    <div className="space-y-1 text-sm text-muted">
                      {opportunity.company && <span>{opportunity.company}</span>}
                      {opportunity.location && <span>• {opportunity.location}</span>}
                      {opportunity.type && <span>• {opportunity.type}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">No opportunity recommendations yet.</div>
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div className="section-panel rounded-xl p-6 bg-highland/5 border-highland/20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-highland text-white">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-ink mb-2">Improve Your Recommendations</h3>
                <p className="text-sm text-muted mb-3">
                  Update your profile with your university, department, and interests to get more personalized recommendations.
                </p>
                <button className="btn-primary text-sm">Update Profile</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
