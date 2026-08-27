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
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-highland">
            <Building2 size={16} />
            University Directory
          </div>
          <h1 className="font-display text-4xl font-semibold text-ink">Find Ethiopian universities and colleges</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Search institutions by name, short name, city, or region, then open official links, contact details,
            and related student resources.
          </p>
        </div>
        <Link to="/browse" className="btn-secondary self-start lg:self-auto">
          <Search size={16} />
          Browse resources
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-line bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search universities by name, short name, city, or region"
              className="min-h-12 w-full rounded-md border-0 pl-11 pr-4 text-sm focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-dark">
            Search directory
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

        <section className="max-h-[calc(100vh-200px)] overflow-y-auto">
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

          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((university) => (
              <Link key={university.id} to={`/universities/${university.slug || university.id}`} className="surface-card rounded-xl p-5">
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-mist text-highland">
                    {university.logoUrl ? (
                      <img src={university.logoUrl} alt={`${university.name} logo`} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={26} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {university.verificationStatus === "VERIFIED" && (
                        <span className="badge-green">
                          <CheckCircle2 size={13} />
                          Verified
                        </span>
                      )}
                      <span className="badge">{labelFromEnum(university.ownership)}</span>
                      <span className="badge">{labelFromEnum(university.institutionType)}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-ink">{university.name}</h2>
                    {university.shortName && <p className="mt-1 text-sm font-semibold text-muted">{university.shortName}</p>}
                    <p className="mt-3 flex flex-wrap items-center gap-1 text-sm text-muted">
                      <MapPin size={15} />
                      {[university.region, university.city].filter(Boolean).join(" - ") || "Location not set"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                  {university.description || "No description has been added yet."}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">
                      <Filter size={13} />
                      {university._count?.resources ?? 0} resources
                    </span>
                    <span className="badge">{university._count?.departments ?? 0} departments</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-highland">
                    View details
                    <ExternalLink size={14} />
                  </span>
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
