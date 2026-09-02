import { useState, useEffect } from "react";
import { Briefcase, GraduationCap, Trophy, Award, Search, Filter, ExternalLink, Calendar } from "lucide-react";
import api from "../api/client.js";

export default function CareerCenter() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEmployment, setFilterEmployment] = useState("all");

  useEffect(() => {
    fetchOpportunities();
  }, [searchQuery, filterType, filterEmployment]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filterType !== "all") params.append("type", filterType);
      if (filterEmployment !== "all") params.append("employmentType", filterEmployment);
      
      const response = await api.get(`/career/opportunities?${params}`);
      setOpportunities(response.data.items);
    } catch (error) {
      console.error("Failed to fetch opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "JOB":
        return <Briefcase size={20} className="text-highland" />;
      case "INTERNSHIP":
        return <GraduationCap size={20} className="text-amber-600" />;
      case "SCHOLARSHIP":
        return <Award size={20} className="text-green-600" />;
      case "COMPETITION":
        return <Trophy size={20} className="text-purple-600" />;
      case "CERTIFICATION":
        return <Award size={20} className="text-blue-600" />;
      default:
        return <Briefcase size={20} className="text-muted" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "JOB":
        return "bg-highland/10 border-highland/20";
      case "INTERNSHIP":
        return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
      case "SCHOLARSHIP":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "COMPETITION":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800";
      case "CERTIFICATION":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      default:
        return "bg-mist border-line dark:bg-dark-border dark:border-dark-border";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Briefcase size={16} />
          Career Center
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Career Opportunities</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Discover jobs, internships, scholarships, competitions, and certifications to advance your career.
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
                  placeholder="Search opportunities..."
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
                <option value="all">All Types</option>
                <option value="JOB">Jobs</option>
                <option value="INTERNSHIP">Internships</option>
                <option value="SCHOLARSHIP">Scholarships</option>
                <option value="COMPETITION">Competitions</option>
                <option value="CERTIFICATION">Certifications</option>
              </select>
              <select
                value={filterEmployment}
                onChange={(e) => setFilterEmployment(e.target.value)}
                className="select-field"
              >
                <option value="all">All Employment Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full empty-state py-12">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="col-span-full empty-state py-12">No opportunities found.</div>
          ) : (
            opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className={`section-panel rounded-xl p-5 transition-colors ${getTypeColor(opportunity.type)}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${getTypeColor(opportunity.type)}`}>
                    {getTypeIcon(opportunity.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink">{opportunity.title}</h3>
                    {opportunity.company && (
                      <p className="text-sm text-muted">{opportunity.company}</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted mb-4 line-clamp-3">{opportunity.description}</p>

                <div className="space-y-2 mb-4">
                  {opportunity.location && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>📍</span>
                      <span>{opportunity.location}</span>
                    </div>
                  )}
                  {opportunity.salary && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>💰</span>
                      <span>{opportunity.salary}</span>
                    </div>
                  )}
                  {opportunity.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Calendar size={14} />
                      <span>Deadline: {formatDate(opportunity.deadline)}</span>
                    </div>
                  )}
                </div>

                {opportunity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {opportunity.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/50 rounded-full text-xs text-muted dark:bg-dark-border dark:text-dark-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {opportunity.applicationUrl && (
                  <a
                    href={opportunity.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Apply Now
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
