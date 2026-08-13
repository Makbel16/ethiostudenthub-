import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client.js";

const TYPES = [
  "BOOK", "LECTURE_NOTE", "ASSIGNMENT", "PROJECT", "LAB_MANUAL",
  "RESEARCH_PAPER", "PREVIOUS_EXAM", "MODEL_EXAM", "CHEAT_SHEET", "CODE", "VIDEO", "OTHER",
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
  title: "", description: "", type: "LECTURE_NOTE", instructor: "", examType: "",
  tags: "", universityId: "", collegeId: "", departmentId: "",
  courseCode: "", courseTitle: "", level: "", semester: "", academicYear: "",
};

export default function Upload() {
  const navigate = useNavigate();
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

  // Reset dependent fields when a parent selection changes
  useEffect(() => {
    setForm((f) => ({ ...f, collegeId: "", departmentId: "" }));
  }, [form.universityId]);
  useEffect(() => {
    setForm((f) => ({ ...f, departmentId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.collegeId]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose a file to upload");

    const required = ["title", "type", "universityId", "departmentId", "courseCode", "level", "semester", "academicYear"];
    const missing = required.filter((f) => !form[f]);
    if (missing.length > 0) {
      return setError(`Please fill in: ${missing.join(", ")}`);
    }

    setError("");
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      data.append("file", file);

      const res = await api.post("/resources", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/resources/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold mb-2">Upload a resource</h1>
      <p className="text-ink/60 mb-8 text-sm">
        Accurate categorization helps other students find this fast. New uploads go to the
        moderation queue before they're visible to everyone.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <input name="title" value={form.title} onChange={onChange} required
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={3}
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Material type *</label>
            <select name="type" value={form.type} onChange={onChange}
              className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
          {form.type === "PREVIOUS_EXAM" || form.type === "MODEL_EXAM" ? (
            <div>
              <label className="text-sm font-medium">Exam type</label>
              <select name="examType" value={form.examType} onChange={onChange}
                className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                <option value="">—</option>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Instructor</label>
              <input name="instructor" value={form.instructor} onChange={onChange}
                className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
            </div>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <p className="course-tab text-xs text-highland mb-3">ACADEMIC CATEGORIZATION</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">University *</label>
              <select name="universityId" value={form.universityId} onChange={onChange} required
                className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                <option value="">Select university</option>
                {universities?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {form.universityId && colleges?.length > 0 && (
              <div>
                <label className="text-sm font-medium">College / School (if applicable)</label>
                <select name="collegeId" value={form.collegeId} onChange={onChange}
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                  <option value="">—</option>
                  {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {form.universityId && (
              <div>
                <label className="text-sm font-medium">Department *</label>
                <select name="departmentId" value={form.departmentId} onChange={onChange} required
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                  <option value="">Select department</option>
                  {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Course code *</label>
                <input name="courseCode" value={form.courseCode} onChange={onChange} required
                  placeholder="e.g. CoSc2012"
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
              </div>
              <div>
                <label className="text-sm font-medium">Course title</label>
                <input name="courseTitle" value={form.courseTitle} onChange={onChange}
                  placeholder="e.g. Data Structures"
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Year / level *</label>
                <select name="level" value={form.level} onChange={onChange} required
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                  <option value="">—</option>
                  {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Semester *</label>
                <select name="semester" value={form.semester} onChange={onChange} required
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
                  <option value="">—</option>
                  {SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Academic year *</label>
                <input name="academicYear" value={form.academicYear} onChange={onChange} required
                  placeholder="2016 or 2024"
                  className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <input name="tags" value={form.tags} onChange={onChange} placeholder="algorithms, midterm"
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
        </div>

        <div>
          <label className="text-sm font-medium">File *</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 bg-white" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button disabled={submitting}
          className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-highland transition-colors disabled:opacity-60">
          {submitting ? "Uploading…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}