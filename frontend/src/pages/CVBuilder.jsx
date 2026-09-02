import { useState } from "react";
import { FileText, Download, Plus, Trash2 } from "lucide-react";

export default function CVBuilder() {
  const [cv, setCV] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    education: [],
    experience: [],
    projects: [],
  });

  const updateCV = (field, value) => {
    setCV({ ...cv, [field]: value });
  };

  const addEducation = () => {
    setCV({
      ...cv,
      education: [...cv.education, { degree: "", field: "", institution: "", startDate: "", endDate: "", gpa: "" }],
    });
  };

  const addExperience = () => {
    setCV({
      ...cv,
      experience: [...cv.experience, { position: "", company: "", startDate: "", endDate: "", description: "" }],
    });
  };

  const addProject = () => {
    setCV({
      ...cv,
      projects: [...cv.projects, { name: "", description: "", startDate: "", endDate: "", technologies: [] }],
    });
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <FileText size={16} />
          CV Builder
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Build Your CV</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Create a professional CV with our easy-to-use builder.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-ink mb-4">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Full Name</label>
              <input
                type="text"
                value={cv.fullName}
                onChange={(e) => updateCV("fullName", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                value={cv.email}
                onChange={(e) => updateCV("email", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                type="text"
                value={cv.phone}
                onChange={(e) => updateCV("phone", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input
                type="text"
                value={cv.location}
                onChange={(e) => updateCV("location", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Professional Summary</label>
              <textarea
                value={cv.summary}
                onChange={(e) => updateCV("summary", e.target.value)}
                className="input-field min-h-24"
                placeholder="Brief professional summary..."
              />
            </div>
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-ink mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {cv.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-highland/10 text-highland rounded-full"
              >
                {skill}
                <button onClick={() => updateCV("skills", cv.skills.filter((_, i) => i !== index))} className="hover:text-ember">
                  <Trash2 size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add a skill..."
              className="input-field flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  updateCV("skills", [...cv.skills, e.target.value.trim()]);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Add a skill..."]');
                if (input && input.value.trim()) {
                  updateCV("skills", [...cv.skills, input.value.trim()]);
                  input.value = "";
                }
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-ink">Education</h2>
            <button onClick={addEducation} className="btn-secondary">
              <Plus size={16} />
              Add Education
            </button>
          </div>
          {cv.education.map((edu, index) => (
            <div key={index} className="border border-line rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <span className="font-semibold text-ink">Education #{index + 1}</span>
                <button onClick={() => updateCV("education", cv.education.filter((_, i) => i !== index))} className="btn-ghost text-ember">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].degree = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Field</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].field = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].institution = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">GPA</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].gpa = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Start Date</label>
                  <input
                    type="text"
                    value={edu.startDate}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].startDate = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                    placeholder="YYYY-MM"
                  />
                </div>
                <div>
                  <label className="field-label">End Date</label>
                  <input
                    type="text"
                    value={edu.endDate}
                    onChange={(e) => {
                      const newEducation = [...cv.education];
                      newEducation[index].endDate = e.target.value;
                      updateCV("education", newEducation);
                    }}
                    className="input-field"
                    placeholder="YYYY-MM or Present"
                  />
                </div>
              </div>
            </div>
          ))}
          {cv.education.length === 0 && <div className="empty-state py-8">No education added yet.</div>}
        </div>

        <div className="flex gap-4 justify-end">
          <button className="btn-secondary">
            <Download size={16} />
            Download PDF
          </button>
          <button className="btn-primary">Save CV</button>
        </div>
      </section>
    </div>
  );
}
