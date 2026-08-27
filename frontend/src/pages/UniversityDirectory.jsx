import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "../api/client.js";

const INSTITUTION_TYPES = [
  { value: "", label: "All types" },
  { value: "UNIVERSITY", label: "University" },
  { value: "COLLEGE", label: "College" },
  { value: "INSTITUTE", label: "Institute" },
  { value: "OTHER", label: "Other" },
];

const OWNERSHIPS = [
  { value: "", label: "All ownership" },
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
];

const VERIFICATION = [
  { value: "", label: "All verification" },
  { value: "VERIFIED", label: "Verified" },
  { value: "UNVERIFIED", label: "Unverified" },
];

const labelFromEnum = (value) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const getItems = (data) => data?.items ?? [];

export default function UniversityDirectory() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  const queryString = params.toString();
  const page = Math.max(Number(params.get("page") || "1"), 1);

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  const universities = useQuery({
    queryKey: ["university-directory", queryString],
    queryFn: () => api.get(`/universities${queryString ? `?${queryString}` : ""}`).then((r) => r.data),
  });

  const filters = useQuery({
    queryKey: ["university-filters"],
    queryFn: () => api.get("/universities/filters").then((r) => r.data),
  });

  const activeFilters = useMemo(
    () => Array.from(params.entries()).filter(([key, value]) => value && key !== "page" && key !== "pageSize"),
    [params]
  );

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
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

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
  };

  const items = getItems(universities.data);
  const total = universities.data?.total || 0;
  const pageSize = universities.data?.pageSize || 12;
  const hasNext = page * pageSize < total;

  return (
    <div className="page-shell py-10">
      {/* Hero Section */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-highland via-highland-dark to-ember p-8 lg:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30"></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white">
              <Building2 size={18} className="text-amber-300" />
              University Directory
            </div>
            <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">
              Discover Ethiopian Universities & Colleges
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/90">
              Explore Ethiopia's finest educational institutions. Search by name, location, or type to access official links, contact details, and comprehensive student resources.
            </p>
          </div>
          <Link to="/browse" className="btn-primary bg-white text-highland hover:bg-amber-50 self-start lg:self-auto shadow-xl">
            <Search size={18} />
            Browse Resources
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
              placeholder="Search universities by name, short name, city, or region"
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
              <label className="field-label">Region</label>
              <select value={params.get("region") || ""} onChange={(e) => updateParam("region", e.target.value)} className="select-field">
                <option value="">All regions</option>
                {filters.data?.regions?.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">City</label>
              <select value={params.get("city") || ""} onChange={(e) => updateParam("city", e.target.value)} className="select-field">
                <option value="">All cities</option>
                {filters.data?.cities?.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Institution type</label>
              <select
                value={params.get("institutionType") || ""}
                onChange={(e) => updateParam("institutionType", e.target.value)}
                className="select-field"
              >
                {INSTITUTION_TYPES.map((type) => (
                  <option key={type.value || "all"} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Ownership</label>
              <select value={params.get("ownership") || ""} onChange={(e) => updateParam("ownership", e.target.value)} className="select-field">
                {OWNERSHIPS.map((ownership) => (
                  <option key={ownership.value || "all"} value={ownership.value}>{ownership.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Verification</label>
              <select
                value={params.get("verificationStatus") || ""}
                onChange={(e) => updateParam("verificationStatus", e.target.value)}
                className="select-field"
              >
                {VERIFICATION.map((status) => (
                  <option key={status.value || "all"} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-ink">
                {universities.isLoading ? "Loading universities..." : `${total} active institution${total === 1 ? "" : "s"}`}
              </p>
              <p className="text-xs text-muted">Inactive institutions are hidden from the public directory.</p>
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

          {universities.isError && (
            <div className="empty-state">
              Could not load the university directory. Make sure the backend API is running.
            </div>
          )}

          {!universities.isError && !universities.isLoading && items.length === 0 && (
            <div className="empty-state">No universities found. Adjust the filters or try a different search.</div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            {items.map((university, index) => (
              <Link key={university.id} to={`/universities/${university.slug || university.id}`} className="group relative overflow-hidden rounded-2xl bg-white border border-line shadow-md hover:shadow-2xl transition-all duration-300 hover:border-highland/50 hover:-translate-y-1">
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-ember/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-highland/5 rounded-full blur-3xl group-hover:bg-highland/10 transition-colors duration-500"></div>
                
                <div className="relative p-6">
                  {/* Header with logo and badges */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-highland/20 bg-gradient-to-br from-highland/10 to-ember/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {university.logoUrl ? (
                        <img src={university.logoUrl} alt={`${university.name} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 size={32} className="text-highland" />
                      )}
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {university.verificationStatus === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 animate-pulse">
                            <CheckCircle2 size={12} />
                            Verified
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-highland/10 px-2.5 py-1 text-xs font-semibold text-highland">
                          {labelFromEnum(university.ownership)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {labelFromEnum(university.institutionType)}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-ink group-hover:text-highland transition-colors duration-300">{university.name}</h2>
                      {university.shortName && <p className="mt-1 text-sm font-semibold text-muted">{university.shortName}</p>}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-highland/10 group-hover:bg-highland/20 transition-colors duration-300">
                      <MapPin size={16} className="text-highland" />
                    </div>
                    <span className="font-medium">{[university.region, university.city].filter(Boolean).join(" - ") || "Location not set"}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted mb-5 line-clamp-2">
                    {university.description || "No description has been added yet."}
                  </p>

                  {/* Stats and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist group-hover:bg-highland/10 transition-colors duration-300">
                          <Filter size={14} className="text-highland" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-ink">{university._count?.resources ?? 0}</p>
                          <p className="text-xs text-muted">Resources</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist group-hover:bg-highland/10 transition-colors duration-300">
                          <Building2 size={14} className="text-highland" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-ink">{university._count?.departments ?? 0}</p>
                          <p className="text-xs text-muted">Depts</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-highland px-4 py-2 text-sm font-semibold text-white shadow-md group-hover:bg-highland-dark group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                      View Details
                      <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
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
