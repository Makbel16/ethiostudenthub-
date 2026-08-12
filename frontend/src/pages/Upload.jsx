import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client.js";

const TYPES = [
  "BOOK", "LECTURE_NOTE", "ASSIGNMENT", "PROJECT", "LAB_MANUAL",
  "RESEARCH_PAPER", "PREVIOUS_EXAM", "MODEL_EXAM", "CHEAT_SHEET", "CODE", "VIDEO", "OTHER",
];
const EXAM_TYPES = ["MID", "FINAL", "QUIZ", "LAB", "PRACTICAL"];

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", type: "LECTURE_NOTE", instructor: "", examType: "", tags: "", universityId: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: universities } = useQuery({
    queryKey: ["universities"],
    queryFn: () => api.get("/universities").then((r) => r.data),
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose a file to upload");
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
        New uploads go to the moderation queue before they're visible to everyone.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
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
            <label className="text-sm font-medium">Type</label>
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

        <div>
          <label className="text-sm font-medium">University</label>
          <select name="universityId" value={form.universityId} onChange={onChange}
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland">
            <option value="">—</option>
            {universities?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <input name="tags" value={form.tags} onChange={onChange} placeholder="algorithms, midterm, 2024"
            className="w-full border border-line px-3 py-2 rounded-sm mt-1 focus:outline-none focus:border-highland" />
        </div>

        <div>
          <label className="text-sm font-medium">File</label>
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