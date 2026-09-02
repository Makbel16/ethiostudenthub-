import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  Search,
  ShieldCheck,
  UploadCloud,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
  Globe,
} from "lucide-react";
import api from "../api/client.js";
import WalkingStudent from "../components/3d/WalkingStudent.jsx";
import "../components/3d/WalkingStudent.css";

const pathways = [
  { icon: Building2, label: "University", value: "Addis Ababa University" },
  { icon: GraduationCap, label: "Department", value: "Computer Science" },
  { icon: BookOpen, label: "Course", value: "Data Structures" },
  { icon: FileText, label: "Material", value: "Final exam and notes" },
];

const featureCards = [
  {
    icon: Building2,
    title: "University Directory",
    text: "Find official websites, student portals, library links, locations, and contact details.",
    to: "/universities",
  },
  {
    icon: Search,
    title: "Find materials fast",
    text: "Search by course code, university, department, year, semester, or material type.",
    to: "/browse",
  },
  {
    icon: FileText,
    title: "Previous exams",
    text: "Keep past papers easy to discover for students preparing for midterms and finals.",
    to: "/browse?type=PREVIOUS_EXAM",
  },
  {
    icon: UploadCloud,
    title: "Contribute safely",
    text: "Uploads enter a moderation queue so the public library stays useful and trustworthy.",
    to: "/upload",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const universities = useQuery({
    queryKey: ["home-universities"],
    queryFn: () => api.get("/universities?pageSize=1").then((r) => r.data),
    retry: false,
  });

  const resources = useQuery({
    queryKey: ["home-resources"],
    queryFn: () => api.get("/resources?pageSize=6&sort=popular").then((r) => r.data),
    retry: false,
  });

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/browse${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  const universityCount = universities.data?.total ? `${universities.data.total}+` : "Growing";
  const resourceCount = resources.data?.total ? `${resources.data.total}+` : "Curated";
  const examCount = resources.data?.items?.filter((item) => item.type === "PREVIOUS_EXAM").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-highland/10 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="page-shell relative py-16 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-highland/30 bg-white/80 px-4 py-2 text-sm font-semibold text-highland shadow-lg backdrop-blur-sm dark:bg-dark-surface/80 dark:border-highland/40">
                <Sparkles size={16} className="animate-pulse" />
                Your Academic Resource Hub
              </div>

              {/* Main Heading */}
              <h1 className="font-display text-5xl font-bold leading-tight text-ink sm:text-6xl lg:text-7xl dark:text-dark-text">
                Find the right
                <span className="block bg-gradient-to-r from-highland to-blue-600 bg-clip-text text-transparent">
                  academic materials
                </span>
                without the confusion
              </h1>

              {/* Subheading */}
              <p className="max-w-2xl text-lg leading-relaxed text-muted dark:text-dark-muted">
                EthioStudentHub organizes student resources by university, department, course, year, semester, and material type so students can get to the useful file quickly.
              </p>

              {/* Search Form */}
              <form onSubmit={onSearch} className="max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl border-2 border-line bg-white p-2 shadow-xl transition-all focus-within:border-highland focus-within:ring-4 focus-within:ring-highland/20 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex items-center gap-2">
                    <Search size={20} className="ml-3 text-muted dark:text-dark-muted" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='Search "CoSc2012 final exam" or "thermodynamics notes"'
                      className="flex-1 border-0 bg-transparent px-3 py-4 text-base focus:ring-0 dark:text-dark-text"
                    />
                    <button type="submit" className="btn-primary rounded-xl px-6 py-3">
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link to="/universities" className="btn-primary inline-flex items-center gap-2">
                  <Globe size={18} />
                  University Directory
                  <ArrowRight size={16} />
                </Link>
                <Link to="/browse" className="btn-secondary inline-flex items-center gap-2">
                  <BookOpen size={18} />
                  Browse Library
                </Link>
                <Link to="/upload" className="btn-secondary inline-flex items-center gap-2">
                  <UploadCloud size={18} />
                  Upload
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <StatItem icon={Building2} label="Universities" value={universityCount} color="blue" />
                <StatItem icon={FileText} label="Resources" value={resourceCount} color="green" />
                <StatItem icon={GraduationCap} label="Exams" value={examCount ? `${examCount}+` : "Ready"} color="purple" />
              </div>
            </div>

            {/* Right Content - Academic Path Card */}
            <div className="relative">
              {/* Walking Student Character - Positioned in top-right area above the card */}
              <div className="absolute -top-48 -right-8 z-10 hidden lg:block">
                <div className="w-64 h-48">
                  <WalkingStudent />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-surface">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-highland/5 to-blue-500/5 dark:from-highland/10 dark:to-blue-500/10" />
                
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">Academic Path</p>
                      <h3 className="font-display text-2xl font-bold text-ink dark:text-dark-text">Search by Structure</h3>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-highland to-highland-dark text-white shadow-lg">
                      <BookOpen size={28} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pathways.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="group flex items-center gap-4 rounded-2xl border border-line bg-white/50 p-4 transition-all hover:border-highland/50 hover:bg-highland/5 dark:border-dark-border dark:bg-dark-border dark:hover:border-highland/30 dark:hover:bg-highland/10">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-highland/10 to-highland/20 text-highland dark:from-highland/20 dark:to-highland/30">
                            <Icon size={22} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold uppercase text-muted dark:text-dark-muted">{item.label}</p>
                            <p className="font-semibold text-ink dark:text-dark-text">{item.value}</p>
                          </div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-highland/10 text-sm font-bold text-highland">
                            0{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Floating info cards */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 space-y-3">
                <div className="rounded-2xl border border-line bg-white p-4 shadow-xl dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-dark-text">Moderated</p>
                      <p className="text-xs text-muted dark:text-dark-muted">Quality assured</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-4 shadow-xl dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-dark-text">Fast Search</p>
                      <p className="text-xs text-muted dark:text-dark-muted">Instant results</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-line bg-white/50 dark:border-dark-border dark:bg-dark-surface/50">
        <div className="page-shell py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-ink dark:text-dark-text">Everything you need</h2>
            <p className="mt-3 text-muted dark:text-dark-muted">Powerful features designed for Ethiopian students</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1 dark:border-dark-border dark:bg-dark-surface"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-highland/10 to-highland/20 text-highland transition-all group-hover:scale-110 dark:from-highland/20 dark:to-highland/30">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-dark-text group-hover:text-highland transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted dark:text-dark-muted">{card.text}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-highland">
                    Explore
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Resources Section */}
      <section className="page-shell py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-highland">
              <TrendingUp size={16} />
              Library
            </div>
            <h2 className="font-display text-3xl font-bold text-ink dark:text-dark-text">Popular Resources</h2>
            <p className="mt-2 text-muted dark:text-dark-muted">A quick view of materials already approved in the library</p>
          </div>
          <Link to="/browse" className="btn-secondary inline-flex items-center gap-2">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {resources.isError && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white py-16 dark:border-dark-border dark:bg-dark-surface">
            <Globe size={48} className="mb-4 text-muted dark:text-dark-muted" />
            <p className="font-semibold text-ink dark:text-dark-text">Start the backend API</p>
            <p className="text-muted dark:text-dark-muted">to load live resources here</p>
          </div>
        )}

        {!resources.isError && resources.data?.items?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white py-16 dark:border-dark-border dark:bg-dark-surface">
            <FileText size={48} className="mb-4 text-muted dark:text-dark-muted" />
            <p className="font-semibold text-ink dark:text-dark-text">No approved resources yet</p>
            <p className="text-muted dark:text-dark-muted">Approved uploads will appear here</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.data?.items?.map((resource) => (
            <Link
              key={resource.id}
              to={`/resources/${resource.id}`}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1 dark:border-dark-border dark:bg-dark-surface"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="badge-green">{resource.type?.replaceAll("_", " ")}</span>
                <div className="flex items-center gap-1 text-xs font-semibold text-muted dark:text-dark-muted">
                  <TrendingUp size={12} />
                  {resource.downloadCount ?? 0}
                </div>
              </div>
              <h3 className="line-clamp-2 text-lg font-semibold text-ink dark:text-dark-text group-hover:text-highland transition-colors">
                {resource.title}
              </h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted dark:text-dark-muted">
                <Building2 size={14} />
                {resource.university?.name || "General resource"}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted dark:text-dark-muted">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {resource._count?.likes ?? 0} likes
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {resource._count?.comments ?? 0} comments
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", darkBg: "dark:bg-blue-900/20", darkIcon: "dark:text-blue-400" },
    green: { bg: "bg-green-50", icon: "text-green-600", darkBg: "dark:bg-green-900/20", darkIcon: "dark:text-green-400" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", darkBg: "dark:bg-purple-900/20", darkIcon: "dark:text-purple-400" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.darkBg}`}>
        <Icon size={20} className={colors.icon + " " + colors.darkIcon} />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase text-muted dark:text-dark-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-dark-text">{value}</p>
    </div>
  );
}
