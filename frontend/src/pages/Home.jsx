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
} from "lucide-react";
import api from "../api/client.js";

const pathways = [
  { icon: Building2, label: "University", value: "Addis Ababa University" },
  { icon: GraduationCap, label: "Department", value: "Computer Science" },
  { icon: BookOpen, label: "Course", value: "Data Structures" },
  { icon: FileText, label: "Material", value: "Final exam and notes" },
];

const featureCards = [
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
    queryFn: () => api.get("/universities").then((r) => r.data),
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

  const universityCount = universities.data?.length ? `${universities.data.length}+` : "Growing";
  const resourceCount = resources.data?.total ? `${resources.data.total}+` : "Curated";
  const examCount = resources.data?.items?.filter((item) => item.type === "PREVIOUS_EXAM").length;

  return (
    <div>
      <section className="page-shell py-10 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland shadow-sm">
              <ShieldCheck size={16} />
              Moderated academic resources for Ethiopian universities
            </div>
            <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Find the right notes, exams, and course materials without the confusion.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              EthioStudentHub organizes student resources by university, department, course, year,
              semester, and material type so students can get to the useful file quickly.
            </p>

            <form onSubmit={onSearch} className="mt-8 max-w-2xl rounded-lg border border-line bg-white p-2 shadow-md">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="home-search">Search resources</label>
                <input
                  id="home-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search "CoSc2012 final exam" or "thermodynamics notes"'
                  className="min-h-12 flex-1 rounded-md border-0 px-4 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
                />
                <button type="submit" className="btn-dark">
                  <Search size={18} />
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/browse" className="btn-primary">
                Browse library
                <ArrowRight size={16} />
              </Link>
              <Link to="/browse?type=PREVIOUS_EXAM" className="btn-secondary">
                Previous exams
              </Link>
              <Link to="/upload" className="btn-secondary">
                Upload material
              </Link>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="stat-tile">
                <dt className="eyebrow">Universities</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-ink">{universityCount}</dd>
              </div>
              <div className="stat-tile">
                <dt className="eyebrow">Resources</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-ink">{resourceCount}</dd>
              </div>
              <div className="stat-tile col-span-2 sm:col-span-1">
                <dt className="eyebrow">Exam focus</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-ink">
                  {examCount ? `${examCount}+` : "Ready"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="section-panel rounded-xl p-5 sm:p-6">
            <div className="rounded-lg bg-ink p-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-white/55">Academic path</p>
                  <p className="mt-1 font-display text-2xl font-semibold">Search by structure</p>
                </div>
                <div className="rounded-full bg-white/10 p-3">
                  <BookOpen size={24} />
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {pathways.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-highland">
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase text-white/50">{item.label}</p>
                        <p className="truncate text-sm font-semibold text-white">{item.value}</p>
                      </div>
                      <span className="text-sm font-semibold text-gold">0{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-paper p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 size={17} className="text-highland" />
                  Moderation queue
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">New uploads are reviewed before becoming public.</p>
              </div>
              <div className="rounded-lg border border-line bg-paper p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <GraduationCap size={17} className="text-gold" />
                  Course discovery
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">Filters mirror how students think about classes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="page-shell py-12">
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} to={card.to} className="surface-card rounded-lg p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-highland-light text-highland">
                    <Icon size={22} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold text-ink">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{card.text}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-highland">
                    Open
                    <ArrowRight size={15} />
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-shell py-14">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Library</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Popular resources</h2>
            <p className="mt-2 text-sm text-muted">A quick view of materials already approved in the library.</p>
          </div>
          <Link to="/browse" className="btn-secondary">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {resources.isError && (
          <div className="empty-state">Start the backend API to load live resources here.</div>
        )}

        {!resources.isError && resources.data?.items?.length === 0 && (
          <div className="empty-state">No approved resources yet. Approved uploads will appear here.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.data?.items?.map((resource) => (
            <Link key={resource.id} to={`/resources/${resource.id}`} className="surface-card rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="badge-green">{resource.type?.replaceAll("_", " ")}</span>
                <span className="text-xs font-semibold text-muted">{resource.downloadCount ?? 0} downloads</span>
              </div>
              <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-ink">{resource.title}</h3>
              <p className="mt-2 text-sm text-muted">{resource.university?.name || "General resource"}</p>
              <p className="mt-4 text-xs font-semibold text-muted">
                {resource._count?.likes ?? 0} likes - {resource._count?.comments ?? 0} comments
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
