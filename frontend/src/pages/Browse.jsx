import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Filter, Search, SlidersHorizontal, X } from "lucide-react";
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
    queryFn: () => api.get("/universities").then((r) => r.data),
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
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-highland">
            <BookOpen size={16} />
            Resource library
          </div>
          <h1 className="font-display text-4xl font-semibold text-ink">Browse academic materials</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Search and filter approved materials by the academic structure students already use:
            university, department, course, level, semester, and material type.
          </p>
        </div>
        <Link to="/upload" className="btn-primary self-start lg:self-auto">
          Upload material
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-line bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, course code, tag, or description"
              className="min-h-12 w-full rounded-md border-0 pl-11 pr-4 text-sm focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-dark">
            Search library
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

        <section>
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

          <div className="grid gap-4 xl:grid-cols-2">
            {resources.data?.items?.map((resource) => (
              <Link key={resource.id} to={`/resources/${resource.id}`} className="surface-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="badge-green">{typeLabel(resource.type)}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                    <Filter size={13} />
                    {resource.downloadCount ?? 0} downloads
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-ink">{resource.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {resource.description || "No description provided."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {resource.university?.name && <span className="badge">{resource.university.name}</span>}
                  {resource.department?.name && <span className="badge">{resource.department.name}</span>}
                  {resource.courseCode && <span className="badge-gold">{resource.courseCode}</span>}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs font-semibold text-muted">
                  <span>{resource.uploader?.fullName ? `Uploaded by ${resource.uploader.fullName}` : "Student upload"}</span>
                  <span>{resource._count?.likes ?? 0} likes - {resource._count?.comments ?? 0} comments</span>
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
