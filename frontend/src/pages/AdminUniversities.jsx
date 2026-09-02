import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Power,
  Trash2,
  UploadCloud,
} from "lucide-react";
import api from "../api/client.js";

const INSTITUTION_TYPES = [
  { value: "UNIVERSITY", label: "University" },
  { value: "COLLEGE", label: "College" },
  { value: "INSTITUTE", label: "Institute" },
  { value: "OTHER", label: "Other" },
];

const OWNERSHIPS = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
];

const VERIFICATION_STATUSES = [
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "VERIFIED", label: "Verified" },
];

const EMPTY_UNIVERSITY_FORM = {
  name: "",
  slug: "",
  shortName: "",
  institutionType: "UNIVERSITY",
  ownership: "PUBLIC",
  region: "",
  city: "",
  address: "",
  description: "",
  logoUrl: "",
  website: "",
  studentPortalUrl: "",
  libraryUrl: "",
  digitalLibraryUrl: "",
  libraryCatalogUrl: "",
  institutionalRepositoryUrl: "",
  contactEmail: "",
  contactPhone: "",
  additionalContactInfo: "",
  latitude: "",
  longitude: "",
  verificationStatus: "UNVERIFIED",
  isActive: true,
  logoFile: null,
};

const formFromUniversity = (university) => ({
  ...EMPTY_UNIVERSITY_FORM,
  name: university.name || "",
  slug: university.slug || "",
  shortName: university.shortName || "",
  institutionType: university.institutionType || "UNIVERSITY",
  ownership: university.ownership || "PUBLIC",
  region: university.region || "",
  city: university.city || "",
  address: university.address || "",
  description: university.description || "",
  logoUrl: university.logoUrl || "",
  website: university.website || "",
  studentPortalUrl: university.studentPortalUrl || "",
  libraryUrl: university.libraryUrl || "",
  digitalLibraryUrl: university.digitalLibraryUrl || "",
  libraryCatalogUrl: university.libraryCatalogUrl || "",
  institutionalRepositoryUrl: university.institutionalRepositoryUrl || "",
  contactEmail: university.contactEmail || "",
  contactPhone: university.contactPhone || "",
  additionalContactInfo: university.additionalContactInfo || "",
  latitude: university.latitude ?? "",
  longitude: university.longitude ?? "",
  verificationStatus: university.verificationStatus || "UNVERIFIED",
  isActive: university.isActive !== false,
  logoFile: null,
});

const toUniversityFormData = (form) => {
  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (key === "logoFile") return;
    data.append(key, value === null || value === undefined ? "" : String(value));
  });
  if (form.logoFile) data.append("logo", form.logoFile);
  return data;
};

const getErrorMessage = (err, fallback) => {
  const error = err.response?.data?.error;
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.formErrors?.length) return error.formErrors.join(", ");
  if (error.fieldErrors) {
    return Object.entries(error.fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ");
  }
  return fallback;
};

const labelFromEnum = (value) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

export default function AdminUniversities() {
  const queryClient = useQueryClient();
  const [universitySearch, setUniversitySearch] = useState("");
  const [universityActiveFilter, setUniversityActiveFilter] = useState("all");
  const [universityForm, setUniversityForm] = useState(EMPTY_UNIVERSITY_FORM);
  const [editingUniversityId, setEditingUniversityId] = useState("");
  const [viewingUniversityId, setViewingUniversityId] = useState("");
  const [universityError, setUniversityError] = useState("");

  const universities = useQuery({
    queryKey: ["admin-universities", universitySearch, universityActiveFilter],
    queryFn: () =>
      api
        .get("/universities", {
          params: {
            active: universityActiveFilter,
            q: universitySearch || undefined,
            pageSize: 100,
            sort: "updated",
          },
        })
        .then((r) => r.data),
  });

  const universityItems = universities.data?.items ?? [];
  const viewingUniversity = universityItems.find((university) => university.id === viewingUniversityId);

  const resetUniversityForm = () => {
    setUniversityForm(EMPTY_UNIVERSITY_FORM);
    setEditingUniversityId("");
    setUniversityError("");
  };

  const createUniversity = useMutation({
    mutationFn: (form) =>
      api.post("/universities", toUniversityFormData(form), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
      resetUniversityForm();
    },
    onError: (err) => setUniversityError(getErrorMessage(err, "Could not create university")),
  });

  const updateUniversity = useMutation({
    mutationFn: ({ id, form }) =>
      api.put(`/universities/${id}`, toUniversityFormData(form), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
      resetUniversityForm();
    },
    onError: (err) => setUniversityError(getErrorMessage(err, "Could not update university")),
  });

  const deleteUniversity = useMutation({
    mutationFn: (id) => api.delete(`/universities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });

  const updateUniversityStatus = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/universities/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });

  const onUniversitySubmit = (e) => {
    e.preventDefault();
    setUniversityError("");
    if (editingUniversityId) {
      updateUniversity.mutate({ id: editingUniversityId, form: universityForm });
    } else {
      createUniversity.mutate(universityForm);
    }
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Building2 size={16} />
          University Management
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Manage Universities</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Add, edit, and manage university directory information and status.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <UniversityForm
          form={universityForm}
          setForm={setUniversityForm}
          onSubmit={onUniversitySubmit}
          isEditing={Boolean(editingUniversityId)}
          onCancel={resetUniversityForm}
          isPending={createUniversity.isPending || updateUniversity.isPending}
          error={universityError}
        />

        <div className="space-y-5">
          <div className="section-panel rounded-xl p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <div>
                <label className="field-label">Search universities</label>
                <input
                  value={universitySearch}
                  onChange={(e) => setUniversitySearch(e.target.value)}
                  placeholder="Name, short name, city, or region"
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Status</label>
                <select
                  value={universityActiveFilter}
                  onChange={(e) => setUniversityActiveFilter(e.target.value)}
                  className="select-field"
                >
                  <option value="all">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {viewingUniversity && <UniversityViewPanel university={viewingUniversity} onClose={() => setViewingUniversityId("")} />}

          {universities.isLoading && <p className="text-sm text-muted">Loading universities...</p>}
          {!universities.isLoading && universityItems.length === 0 && (
            <div className="empty-state">No universities found.</div>
          )}

          <div className="grid gap-3">
            {universityItems.map((university) => (
              <div key={university.id} className="surface-card rounded-xl p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-mist text-highland dark:bg-dark-border dark:border-dark-border">
                      {university.logoUrl ? (
                        <img src={university.logoUrl} alt={`${university.name} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 size={24} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={university.isActive ? "badge-green" : "badge-gold"}>
                          {university.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className={university.verificationStatus === "VERIFIED" ? "badge-green" : "badge-gold"}>
                          {university.verificationStatus === "VERIFIED" ? "Verified" : "Unverified"}
                        </span>
                        <span className="badge">{labelFromEnum(university.ownership)}</span>
                        <span className="badge">{labelFromEnum(university.institutionType)}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-ink">{university.name}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {[university.shortName, university.region, university.city].filter(Boolean).join(" - ") || `/${university.slug}`}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-muted">
                        {university._count?.departments ?? 0} departments - {university._count?.resources ?? 0} resources
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setViewingUniversityId(university.id)} className="btn-secondary min-h-9 px-3 py-1.5">
                      <Eye size={15} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setEditingUniversityId(university.id);
                        setUniversityForm(formFromUniversity(university));
                        setUniversityError("");
                      }}
                      className="btn-secondary min-h-9 px-3 py-1.5"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        updateUniversityStatus.mutate({
                          id: university.id,
                          data: {
                            verificationStatus:
                              university.verificationStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED",
                          },
                        })
                      }
                      className="btn-secondary min-h-9 px-3 py-1.5"
                    >
                      <CheckCircle2 size={15} />
                      {university.verificationStatus === "VERIFIED" ? "Unverify" : "Verify"}
                    </button>
                    <button
                      onClick={() =>
                        updateUniversityStatus.mutate({
                          id: university.id,
                          data: { isActive: !university.isActive },
                        })
                      }
                      className="btn-secondary min-h-9 px-3 py-1.5"
                    >
                      <Power size={15} />
                      {university.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deactivate ${university.name}? It will be hidden from the public directory.`)) {
                          deleteUniversity.mutate(university.id);
                        }
                      }}
                      className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function UniversityForm({ form, setForm, onSubmit, isEditing, onCancel, isPending, error }) {
  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setForm((current) => ({ ...current, logoFile: files?.[0] || null }));
      return;
    }
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <form onSubmit={onSubmit} className="section-panel h-fit rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{isEditing ? "Edit university" : "Add university"}</h2>
          <p className="mt-1 text-sm text-muted">Manage directory information, public links, contact details, and status.</p>
        </div>
        {isEditing && (
          <button type="button" onClick={onCancel} className="btn-secondary min-h-9 px-3 py-1.5">
            Cancel
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="field-label">Name *</label>
          <input name="name" value={form.name} onChange={onChange} required className="input-field" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Short name</label>
            <input name="shortName" value={form.shortName} onChange={onChange} placeholder="DBU" className="input-field" />
          </div>
          <div>
            <label className="field-label">Slug</label>
            <input name="slug" value={form.slug} onChange={onChange} placeholder="debre-berhan-university" className="input-field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Institution type *</label>
            <select name="institutionType" value={form.institutionType} onChange={onChange} className="select-field">
              {INSTITUTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Ownership *</label>
            <select name="ownership" value={form.ownership} onChange={onChange} className="select-field">
              {OWNERSHIPS.map((ownership) => (
                <option key={ownership.value} value={ownership.value}>{ownership.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Region *</label>
            <input name="region" value={form.region} onChange={onChange} required placeholder="Amhara" className="input-field" />
          </div>
          <div>
            <label className="field-label">City</label>
            <input name="city" value={form.city} onChange={onChange} placeholder="Debre Berhan" className="input-field" />
          </div>
        </div>

        <div>
          <label className="field-label">Address</label>
          <input name="address" value={form.address} onChange={onChange} className="input-field" />
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className="input-field resize-none" />
        </div>

        <div className="rounded-lg border border-line bg-paper p-4 dark:bg-dark-surface dark:border-dark-border">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <UploadCloud size={16} className="text-highland" />
            Logo
          </p>
          <div className="grid gap-3">
            <input type="file" accept="image/png,image/jpeg" onChange={onChange} className="input-field" />
            <input name="logoUrl" value={form.logoUrl} onChange={onChange} type="url" placeholder="Or paste an existing logo URL" className="input-field" />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-4 dark:bg-dark-surface dark:border-dark-border">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Globe2 size={16} className="text-highland" />
            Official links
          </p>
          <div className="space-y-3">
            <input name="website" value={form.website} onChange={onChange} type="url" placeholder="Official website" className="input-field" />
            <input name="studentPortalUrl" value={form.studentPortalUrl} onChange={onChange} type="url" placeholder="Student portal URL" className="input-field" />
            <input name="libraryUrl" value={form.libraryUrl} onChange={onChange} type="url" placeholder="Library website" className="input-field" />
            <input name="digitalLibraryUrl" value={form.digitalLibraryUrl} onChange={onChange} type="url" placeholder="Digital library URL" className="input-field" />
            <input name="libraryCatalogUrl" value={form.libraryCatalogUrl} onChange={onChange} type="url" placeholder="Library catalog URL" className="input-field" />
            <input name="institutionalRepositoryUrl" value={form.institutionalRepositoryUrl} onChange={onChange} type="url" placeholder="Institutional repository URL" className="input-field" />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-4 dark:bg-dark-surface dark:border-dark-border">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Phone size={16} className="text-highland" />
            Contact
          </p>
          <div className="space-y-3">
            <input name="contactEmail" value={form.contactEmail} onChange={onChange} type="email" placeholder="Contact email" className="input-field" />
            <input name="contactPhone" value={form.contactPhone} onChange={onChange} placeholder="+251..." className="input-field" />
            <textarea
              name="additionalContactInfo"
              value={form.additionalContactInfo}
              onChange={onChange}
              rows={3}
              placeholder="Additional contact information"
              className="input-field resize-none"
            />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-4 dark:bg-dark-surface dark:border-dark-border">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <MapPin size={16} className="text-highland" />
            Optional coordinates
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="latitude" value={form.latitude} onChange={onChange} type="number" step="any" placeholder="Latitude" className="input-field" />
            <input name="longitude" value={form.longitude} onChange={onChange} type="number" step="any" placeholder="Longitude" className="input-field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Verification</label>
            <select name="verificationStatus" value={form.verificationStatus} onChange={onChange} className="select-field">
              {VERIFICATION_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink dark:bg-dark-surface dark:border-dark-border dark:text-dark-text">
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
            Active
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
            {error}
          </div>
        )}

        <button disabled={isPending} className="btn-dark w-full">
          {isPending ? "Saving..." : isEditing ? "Update university" : "Add university"}
        </button>
      </div>
    </form>
  );
}

function UniversityViewPanel({ university, onClose }) {
  const linkItems = [
    { label: "Official website", url: university.website },
    { label: "Student portal", url: university.studentPortalUrl },
    { label: "Library website", url: university.libraryUrl },
    { label: "Digital library", url: university.digitalLibraryUrl },
    { label: "Library catalog", url: university.libraryCatalogUrl },
    { label: "Repository", url: university.institutionalRepositoryUrl },
  ].filter((item) => item.url);

  return (
    <div className="section-panel rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{university.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {[university.region, university.city, university.address].filter(Boolean).join(" - ") || "Location not set"}
          </p>
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-muted hover:text-ink">
          Close
        </button>
      </div>

      {university.description && <p className="mt-4 text-sm leading-6 text-muted">{university.description}</p>}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoTile label="Contact email" value={university.contactEmail || "Not available"} />
        <InfoTile label="Phone" value={university.contactPhone || "Not available"} />
        <InfoTile label="Type" value={labelFromEnum(university.institutionType)} />
        <InfoTile label="Ownership" value={labelFromEnum(university.ownership)} />
      </dl>

      {linkItems.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {linkItems.map((item) => (
            <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="btn-secondary min-h-9 px-3 py-1.5">
              <ExternalLink size={15} />
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3 dark:bg-dark-surface dark:border-dark-border">
      <dt className="text-xs font-semibold uppercase text-muted dark:text-dark-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink dark:text-dark-text">{value}</dd>
    </div>
  );
}
