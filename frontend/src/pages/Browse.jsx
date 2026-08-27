import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Filter, Search, SlidersHorizontal, X, UploadCloud, Building2, UserCircle } from "lucide-react";
import api from "../api/client.js";

const TYPES = [
  { value: "", label: "All materials" },
  { value: "PREVIOUS_EXAM", label: "Previous exams" },
  { value: "LECTURE_NOTE", label: "Lecture notes" },
  { value: "BOOK", label: "Books" },
  { value: "ASSIGNMENT", label: "Assignments" },
  { value: "PROJECT", label: "Projects" },
  { value: "LAB_MANUAL", label: "Lab manuals" },
  { value: "RESEARCH_PAPER", label: "Research papers" },
  { value: "MODEL_EXAM", label: "Model exams" },
  { value: "USEFUL_LINK", label: "Useful links" },
  { value: "OTHER", label: "Other" },
];

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
  { value: "YEAR_6", label: "Year 6" },
  { value: "MASTERS", label: "Master's" },
  { value: "PHD", label: "PhD" },
];

const SEMESTERS = [
  { value: "", label: "All semesters" },
  { value: "SEMESTER_1", label: "Semester 1" },
  { value: "SEMESTER_2", label: "Semester 2" },
  { value: "SUMMER", label: "Summer" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most downloaded" },
  { value: "rating", label: "Most liked" },
];

const typeLabel = (type) => type?.replaceAll("_", " ") || "RESOURCE";

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  const queryString = params.toString();
  const selectedUniversity = params.get("universityId") || "";

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  const resources = useQuery({
    queryKey: ["resources", queryString],
    queryFn: () => api.get(`/resources${queryString ? `?${queryString}` : ""}`).then((r) => r.data),
  });

  const universities = useQuery({
    queryKey: ["universities"],
    queryFn: () => api.get("/universities/options").then((r) => r.data),
  });

  const departments = useQuery({
    queryKey: ["browse-departments", selectedUniversity],
    queryFn: () => api.get(`/universities/${selectedUniversity}/departments`).then((r) => r.data),
    enabled: !!selectedUniversity,
  });

  const activeFilters = useMemo(
    () =>
      Array.from(params.entries()).filter(([key, value]) => value && key !== "page" && key !== "pageSize"),
    [params]
  );

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "universityId") next.delete("departmentId");
    next.delete("page");
    setParams(next);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateParam("q", q.trim());
  };

  const clearFilters = () => {
    setQ("");
    setParams({});
  };

  const page = Math.max(Number(params.get("page") || "1"), 1);
  const pageSize = resources.data?.pageSize || 20;
  const total = resources.data?.total || 0;
  const hasNext = page * pageSize < total;

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
  };

  return (
    <div className="page-shell py-10">
      {/* Hero Section */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-highland via-highland-dark to-ember p-8 lg:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30"></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white">
              <BookOpen size={18} className="text-amber-300" />
              Resource Library
            </div>
            <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">
              Browse Academic Materials
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/90">
              Access thousands of approved educational resources. Filter by university, department, course, level, and material type to find exactly what you need.
            </p>
          </div>
          <Link to="/upload" className="btn-primary bg-white text-highland hover:bg-amber-50 self-start lg:self-auto shadow-xl">
            <UploadCloud size={18} />
            Upload Material
          </Link>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mb-8 rounded-2xl border-2 border-highland/20 bg-white p-2 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-highland" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, course code, tag, or description"
              className="min-h-14 w-full rounded-xl border-0 bg-mist/50 pl-12 pr-4 text-base focus:bg-white focus:ring-2 focus:ring-highland/50 transition-all"
            />
          </div>
          <button type="submit" className="btn-primary min-h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
            <Search size={18} className="mr-2" />
            Search
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <SlidersHorizontal size={18} className="text-highland" />
              Filters
            </p>
            {activeFilters.length > 0 && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-ember hover:underline">
                Clear
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Material type</label>
              <select value={params.get("type") || ""} onChange={(e) => updateParam("type", e.target.value)} className="select-field">
                {TYPES.map((type) => (
                  <option key={type.value || "all"} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">University</label>
              <select
                value={selectedUniversity}
                onChange={(e) => updateParam("universityId", e.target.value)}
                className="select-field"
              >
                <option value="">All universities</option>
                {universities.data?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Department</label>
              <select
                value={params.get("departmentId") || ""}
                onChange={(e) => updateParam("departmentId", e.target.value)}
                className="select-field"
                disabled={!selectedUniversity}
              >
                <option value="">{selectedUniversity ? "All departments" : "Select university first"}</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Course code</label>
              <input
                value={params.get("courseCode") || ""}
                onChange={(e) => updateParam("courseCode", e.target.value)}
                placeholder="CoSc2012"
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Level</label>
                <select value={params.get("level") || ""} onChange={(e) => updateParam("level", e.target.value)} className="select-field">
                  {LEVELS.map((level) => (
                    <option key={level.value || "all"} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Semester</label>
                <select value={params.get("semester") || ""} onChange={(e) => updateParam("semester", e.target.value)} className="select-field">
                  {SEMESTERS.map((semester) => (
                    <option key={semester.value || "all"} value={semester.value}>{semester.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">Sort by</label>
              <select value={params.get("sort") || "newest"} onChange={(e) => updateParam("sort", e.target.value)} className="select-field">
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-ink">
                {resources.isLoading ? "Loading resources..." : `${total} approved resource${total === 1 ? "" : "s"}`}
              </p>
              <p className="text-xs text-muted">Only approved resources are visible in public browse results.</p>
            </div>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.slice(0, 5).map(([key, value]) => (
                  <button key={key} type="button" onClick={() => updateParam(key, "")} className="badge">
                    {key}: {value}
                    <X size={13} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {resources.isError && (
            <div className="empty-state">
              Could not reach the API. Make sure the backend is running at the configured VITE_API_URL.
            </div>
          )}

          {!resources.isError && resources.data?.items?.length === 0 && (
            <div className="empty-state">No resources found. Adjust the filters or try a different search.</div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            {resources.data?.items?.map((resource, index) => (
              <Link key={resource.id} to={`/resources/${resource.id}`} className="group relative overflow-hidden rounded-2xl bg-white border border-line shadow-md hover:shadow-2xl transition-all duration-300 hover:border-highland/50 hover:-translate-y-1">
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-ember/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-highland/5 rounded-full blur-3xl group-hover:bg-highland/10 transition-colors duration-500"></div>
                
                <div className="relative p-6">
                  {/* Header with type badge and downloads */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 group-hover:scale-105 transition-transform duration-300">
                      <BookOpen size={12} />
                      {typeLabel(resource.type)}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-muted group-hover:scale-105 transition-transform duration-300">
                      <Filter size={14} className="text-highland" />
                      {resource.downloadCount ?? 0}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-ink group-hover:text-highland transition-colors duration-300 mb-3 line-clamp-2">{resource.title}</h2>
                  
                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted mb-4 line-clamp-2">
                    {resource.description || "No description provided."}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resource.university?.name && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-highland/10 px-2.5 py-1 text-xs font-semibold text-highland group-hover:bg-highland/20 transition-colors duration-300">
                        <Building2 size={12} />
                        {resource.university.name}
                      </span>
                    )}
                    {resource.department?.name && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 group-hover:bg-blue-100 transition-colors duration-300">
                        {resource.department.name}
                      </span>
                    )}
                    {resource.courseCode && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 group-hover:bg-amber-200 transition-colors duration-300">
                        {resource.courseCode}
                      </span>
                    )}
                  </div>

                  {/* Footer with stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <div className="flex items-center gap-2 text-sm text-muted group-hover:scale-105 transition-transform duration-300">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-highland/10 group-hover:bg-highland/20 transition-colors duration-300">
                        <UserCircle size={14} className="text-highland" />
                      </div>
                      <span className="font-medium">{resource.uploader?.fullName || "Student upload"}</span>
                    </div>
                    <div className="flex gap-4 group-hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-1 text-sm font-semibold text-muted">
                        <span className="text-highland group-hover:scale-110 transition-transform duration-300">♥</span>
                        {resource._count?.likes ?? 0}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-muted">
                        <span className="group-hover:scale-110 transition-transform duration-300">💬</span>
                        {resource._count?.comments ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {total > pageSize && (
            <div className="mt-8 flex items-center justify-between rounded-lg border border-line bg-white p-3 shadow-sm">
              <button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="btn-secondary">
                Previous
              </button>
              <span className="text-sm font-semibold text-muted">Page {page}</span>
              <button disabled={!hasNext} onClick={() => goToPage(page + 1)} className="btn-secondary">
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
