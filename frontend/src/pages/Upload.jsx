import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileUp,
  GraduationCap,
  Info,
  Layers3,
  UploadCloud,
  ArrowRight,
  FileText,
  Building2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const TYPES = [
  "BOOK",
  "LECTURE_NOTE",
  "ASSIGNMENT",
  "PROJECT",
  "LAB_MANUAL",
  "RESEARCH_PAPER",
  "PREVIOUS_EXAM",
  "MODEL_EXAM",
  "CHEAT_SHEET",
  "CODE",
  "VIDEO",
  "USEFUL_LINK",
  "OTHER",
];

const USEFUL_LINK_TYPE = "USEFUL_LINK";

const EXAM_TYPES = ["MID", "FINAL", "QUIZ", "LAB", "PRACTICAL"];

const LEVELS = [
  { value: "YEAR_1", label: "Year 1 / Freshman" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
  { value: "YEAR_6", label: "Year 6" },
  { value: "MASTERS", label: "Master's" },
  { value: "PHD", label: "PhD" },
];

const SEMESTERS = [
  { value: "SEMESTER_1", label: "Semester 1" },
  { value: "SEMESTER_2", label: "Semester 2" },
  { value: "SUMMER", label: "Summer" },
];

const emptyForm = {
  title: "",
  description: "",
  type: "LECTURE_NOTE",
  instructor: "",
  examType: "",
  tags: "",
  universityId: "",
  collegeId: "",
  departmentId: "",
  courseCode: "",
  courseTitle: "",
  level: "",
  semester: "",
  academicYear: "",
  url: "",
  usefulLinkUrl: "",
};

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: universities } = useQuery({
    queryKey: ["universities"],
    queryFn: () => api.get("/universities/options").then((r) => r.data),
  });

  const { data: colleges } = useQuery({
    queryKey: ["colleges", form.universityId],
    queryFn: () => api.get(`/universities/${form.universityId}/colleges`).then((r) => r.data),
    enabled: !!form.universityId,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", form.universityId, form.collegeId],
    queryFn: () =>
      api
        .get(`/universities/${form.universityId}/departments`, {
          params: form.collegeId ? { collegeId: form.collegeId } : {},
        })
        .then((r) => r.data),
    enabled: !!form.universityId,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, collegeId: "", departmentId: "" }));
  }, [form.universityId]);

  useEffect(() => {
    setForm((f) => ({ ...f, departmentId: "" }));
  }, [form.collegeId]);

  const isUsefulLink = form.type === USEFUL_LINK_TYPE;

  const isValidHttpUrl = (value) => {
    try {
      const url = new URL(value.trim());
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "type" && value === USEFUL_LINK_TYPE) setFile(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const required = isUsefulLink
      ? ["title", "type", "url"]
      : ["title", "type", "universityId", "departmentId", "courseCode", "level", "semester", "academicYear"];
    const missing = required.filter((field) => !form[field]);
    if (missing.length > 0) {
      return setError(`Please fill in: ${missing.join(", ")}`);
    }
    if (isUsefulLink && !isValidHttpUrl(form.url)) {
      return setError("Please enter a valid http or https URL.");
    }
    if (!isUsefulLink && form.usefulLinkUrl && !isValidHttpUrl(form.usefulLinkUrl)) {
      return setError("Please enter a valid http or https URL for the Useful Link field.");
    }
    if (!isUsefulLink && !file) return setError("Please choose a file to upload.");

    setError("");
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => value && data.append(key, value));
      if (!isUsefulLink) data.append("file", file);

      const res = await api.post("/resources", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/resources/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please check the file and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const checklistItems = isUsefulLink
    ? [
        "Use a clear, searchable title.",
        "Paste a direct http or https URL.",
        "Describe why the link is useful for students.",
        "Avoid duplicates, expired pages, or unsafe destinations.",
      ]
    : [
        "Use a clear, searchable title.",
        "Choose the correct university and department.",
        "Add course code, year, semester, and academic year.",
        "Avoid duplicate or unreadable files.",
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="page-shell py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-highland">
            <UploadCloud size={16} />
            Upload Resource
          </div>
          <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">
            Share your academic materials
          </h1>
          <p className="mt-2 text-muted dark:text-dark-muted">
            Upload files or share useful links to help fellow students succeed.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Material Details Section */}
            <section className="rounded-xl border border-line bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text">Material Details</h2>
                  <p className="text-sm text-muted dark:text-dark-muted">
                    {isUsefulLink ? "Describe the link clearly" : "Describe the file clearly"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="field-label">Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    required
                    placeholder={isUsefulLink ? "e.g. Free programming textbook collection" : "e.g. Data Structures Final Exam 2024"}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="field-label">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    placeholder={
                      isUsefulLink
                        ? "Add what students will find there, who it helps, and any usage context."
                        : "Add edition, lecturer, chapter range, exam session, or any context students should know."
                    }
                    className="input-field resize-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="field-label">Material type *</label>
                    <select name="type" value={form.type} onChange={onChange} className="select-field">
                      {TYPES.map((type) => (
                        <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </div>

                  {isUsefulLink ? (
                    <div>
                      <label className="field-label">URL *</label>
                      <input
                        name="url"
                        type="url"
                        inputMode="url"
                        value={form.url}
                        onChange={onChange}
                        required
                        placeholder="https://example.com/resource"
                        className="input-field"
                      />
                    </div>
                  ) : form.type === "PREVIOUS_EXAM" || form.type === "MODEL_EXAM" ? (
                    <div>
                      <label className="field-label">Exam type</label>
                      <select name="examType" value={form.examType} onChange={onChange} className="select-field">
                        <option value="">Not specified</option>
                        {EXAM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="field-label">Instructor</label>
                      <input
                        name="instructor"
                        value={form.instructor}
                        onChange={onChange}
                        placeholder="Instructor name if known"
                        className="input-field"
                      />
                    </div>
                  )}
                </div>

                {!isUsefulLink && (
                  <div>
                    <label className="field-label">Useful Link</label>
                    <input
                      name="usefulLinkUrl"
                      type="url"
                      inputMode="url"
                      value={form.usefulLinkUrl}
                      onChange={onChange}
                      placeholder="https://example.com/related-resource"
                      className="input-field"
                    />
                    <p className="mt-2 text-xs text-muted dark:text-dark-muted">Optional related page for this specific material.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Academic Classification Section */}
            <section className="rounded-xl border border-line bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text">
                    {isUsefulLink ? "Institution Association" : "Academic Classification"}
                  </h2>
                  <p className="text-sm text-muted dark:text-dark-muted">
                    {isUsefulLink ? "Connect to a university when applicable" : "Used in browse filters and search"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="field-label">{isUsefulLink ? "University" : "University *"}</label>
                  <select
                    name="universityId"
                    value={form.universityId}
                    onChange={onChange}
                    required={!isUsefulLink}
                    className="select-field"
                  >
                    <option value="">{isUsefulLink ? "General useful link" : "Select university"}</option>
                    {universities?.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {form.universityId && colleges?.length > 0 && (
                  <div>
                    <label className="field-label">College / School</label>
                    <select name="collegeId" value={form.collegeId} onChange={onChange} className="select-field">
                      <option value="">No college selected</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="field-label">{isUsefulLink ? "Department" : "Department *"}</label>
                  <select
                    name="departmentId"
                    value={form.departmentId}
                    onChange={onChange}
                    required={!isUsefulLink}
                    disabled={!form.universityId}
                    className="select-field"
                  >
                    <option value="">{form.universityId ? "Select department" : "Select university first"}</option>
                    {departments?.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>

                {!isUsefulLink && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="field-label">Course code *</label>
                        <input
                          name="courseCode"
                          value={form.courseCode}
                          onChange={onChange}
                          required
                          placeholder="e.g. CoSc2012"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label">Course title</label>
                        <input
                          name="courseTitle"
                          value={form.courseTitle}
                          onChange={onChange}
                          placeholder="e.g. Data Structures"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="field-label">Year / level *</label>
                        <select name="level" value={form.level} onChange={onChange} required className="select-field">
                          <option value="">Select level</option>
                          {LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Semester *</label>
                        <select name="semester" value={form.semester} onChange={onChange} required className="select-field">
                          <option value="">Select semester</option>
                          {SEMESTERS.map((semester) => (
                            <option key={semester.value} value={semester.value}>{semester.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Academic year *</label>
                        <input
                          name="academicYear"
                          value={form.academicYear}
                          onChange={onChange}
                          required
                          placeholder="2016 or 2024"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="field-label">Tags</label>
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={onChange}
                    placeholder={isUsefulLink ? "portal, library, admissions" : "algorithms, final, solved"}
                    className="input-field"
                  />
                </div>
              </div>
            </section>

            {/* File Upload Section */}
            {!isUsefulLink && (
              <section className="rounded-xl border border-line bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                    <FileUp size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text">File Upload</h2>
                    <p className="text-sm text-muted dark:text-dark-muted">PDF, Word, PowerPoint, ZIP, image, or MP4</p>
                  </div>
                </div>

                <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-gray-50 p-8 text-center transition-all hover:border-highland hover:bg-highland/5 dark:border-dark-border dark:bg-dark-border dark:hover:border-highland dark:hover:bg-highland/10">
                  <UploadCloud size={48} className="mb-4 text-muted group-hover:text-highland transition-colors dark:text-dark-muted" />
                  <span className="text-base font-semibold text-ink dark:text-dark-text">
                    {file ? file.name : "Choose a file to upload"}
                  </span>
                  <span className="mt-2 text-sm text-muted dark:text-dark-muted">
                    {file ? "Click to change file" : "or drag and drop"}
                  </span>
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="sr-only" />
                </label>
              </section>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted dark:text-dark-muted">
                Submitted resources are reviewed before public listing.
              </p>
              <button
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    <span>Submit for review</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Checklist Card */}
            <div className="rounded-xl border border-line bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-highland" />
                <h3 className="font-display font-semibold text-ink dark:text-dark-text">Submission Checklist</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted dark:text-dark-muted">
                {checklistItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-highland" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Moderation Info */}
            <div className="rounded-xl border border-highland/20 bg-highland/5 p-5 dark:border-highland/30 dark:bg-highland/10">
              <div className="mb-3 flex items-center gap-2">
                <Layers3 size={18} className="text-highland" />
                <h3 className="font-display font-semibold text-ink dark:text-dark-text">Moderation Status</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted dark:text-dark-muted">
                After submission, the resource appears in your dashboard as pending until an admin or moderator approves it.
              </p>
            </div>

            {/* Verification Warning */}
            {user && !user.isVerified && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="font-display font-semibold text-amber-800 dark:text-amber-200">Email Not Verified</h3>
                </div>
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                  Your dashboard shows this account as unverified. Verify your email when the verification link is available.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
