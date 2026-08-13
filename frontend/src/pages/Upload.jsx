import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileUp, GraduationCap, Info, Layers3, UploadCloud } from "lucide-react";
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
  "OTHER",
];

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
    queryFn: () => api.get("/universities").then((r) => r.data),
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

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose a file to upload.");

    const required = ["title", "type", "universityId", "departmentId", "courseCode", "level", "semester", "academicYear"];
    const missing = required.filter((field) => !form[field]);
    if (missing.length > 0) {
      return setError(`Please fill in: ${missing.join(", ")}`);
    }

    setError("");
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => value && data.append(key, value));
      data.append("file", file);

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

  return (
    <div className="page-shell py-10">
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <UploadCloud size={16} />
          Contributor workflow
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Upload a resource</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Add clean metadata so students can discover this material by university, department,
          course, level, semester, and academic year. New uploads go to moderation first.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <Info size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Material details</h2>
                <p className="text-sm text-muted">Describe the file clearly before classifying it.</p>
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
                  placeholder="e.g. Data Structures Final Exam 2024"
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
                  placeholder="Add edition, lecturer, chapter range, exam session, or any context students should know."
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

                {form.type === "PREVIOUS_EXAM" || form.type === "MODEL_EXAM" ? (
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
            </div>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <GraduationCap size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Academic classification</h2>
                <p className="text-sm text-muted">This is the structure used in browse filters and search results.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="field-label">University *</label>
                <select name="universityId" value={form.universityId} onChange={onChange} required className="select-field">
                  <option value="">Select university</option>
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
                <label className="field-label">Department *</label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={onChange}
                  required
                  disabled={!form.universityId}
                  className="select-field"
                >
                  <option value="">{form.universityId ? "Select department" : "Select university first"}</option>
                  {departments?.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

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

              <div>
                <label className="field-label">Tags</label>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={onChange}
                  placeholder="algorithms, final, solved"
                  className="input-field"
                />
              </div>
            </div>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <FileUp size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">File</h2>
                <p className="text-sm text-muted">PDF, Word, PowerPoint, ZIP, image, or MP4 up to the backend limit.</p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-highland/40 bg-highland-light/60 px-6 py-10 text-center transition-colors hover:bg-highland-light">
              <UploadCloud size={34} className="text-highland" />
              <span className="mt-3 text-sm font-semibold text-ink">
                {file ? file.name : "Choose a file to upload"}
              </span>
              <span className="mt-1 text-xs text-muted">Your file will be attached to this resource record.</span>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="sr-only" />
            </label>
          </section>

          {error && (
            <div className="rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Submitted resources are reviewed before public listing.</p>
            <button disabled={submitting} className="btn-dark">
              {submitting ? "Uploading..." : "Submit for review"}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="section-panel rounded-xl p-5">
            <p className="font-semibold text-ink">Upload checklist</p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {[
                "Use a clear, searchable title.",
                "Choose the correct university and department.",
                "Add course code, year, semester, and academic year.",
                "Avoid duplicate or unreadable files.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-highland" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-gold/25 bg-gold/10 p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Layers3 size={18} className="text-gold" />
              Moderation status
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              After submission, the resource appears in your dashboard as pending until an admin or moderator approves it.
            </p>
          </div>

          {user && !user.isVerified && (
            <div className="rounded-xl border border-ember/20 bg-ember/5 p-5">
              <p className="font-semibold text-ember">Email not verified</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                Your dashboard shows this account as unverified. Verify your email when the verification link is available.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
