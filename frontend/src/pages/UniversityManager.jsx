import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  Edit3,
  GraduationCap,
  Layers3,
  Megaphone,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import api from "../api/client.js";

const CALENDAR_TYPES = [
  { value: "SEMESTER_START", label: "Semester Start" },
  { value: "SEMESTER_END", label: "Semester End" },
  { value: "REGISTRATION_DEADLINE", label: "Registration Deadline" },
  { value: "EXAM_PERIOD", label: "Exam Period" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "GRADUATION", label: "Graduation Date" },
];

const SEMESTERS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Summer" },
];

const UNASSIGNED_COLLEGE_ID = "__unassigned__";

const emptyProgramForm = {
  name: "",
  collegeId: "",
  durationYears: "",
  degreeAwarded: "",
  programOverview: "",
  admissionRequirements: "",
};

const emptyBatchForm = {
  admissionYear: "",
  capacity: "",
  notes: "",
};

const emptyCourseForm = {
  title: "",
  code: "",
  year: "1",
  semester: "1",
};

const emptyCalendarForm = {
  type: "SEMESTER_START",
  title: "",
  startDate: "",
  endDate: "",
};

const emptyAnnouncementForm = {
  title: "",
  body: "",
};

const typeLabel = (type) => CALENDAR_TYPES.find((item) => item.value === type)?.label || type?.replaceAll("_", " ");

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const formatRange = (item) => {
  if (!item.endDate || item.endDate === item.startDate) return formatDate(item.startDate);
  return `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
};

const ordinal = (value) => {
  const number = Number(value);
  if (!number) return "Year not set";
  const mod10 = number % 10;
  const mod100 = number % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? "st" : mod10 === 2 && mod100 !== 12 ? "nd" : mod10 === 3 && mod100 !== 13 ? "rd" : "th";
  return `${number}${suffix} Year`;
};

const semesterLabel = (value) => SEMESTERS.find((semester) => semester.value === String(value))?.label || "Semester not set";

const yearOptions = (durationYears) => {
  const count = Math.max(Number(durationYears) || 6, 1);
  return Array.from({ length: count }, (_, index) => String(index + 1));
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

const groupedCourses = (courses = []) => {
  const groups = new Map();
  courses.forEach((course) => {
    const year = course.year || 0;
    const semester = course.semester || 0;
    const key = `${year}-${semester}`;
    if (!groups.has(key)) groups.set(key, { year, semester, courses: [] });
    groups.get(key).courses.push(course);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.semester - b.semester;
  });
};

export default function UniversityManager() {
  const queryClient = useQueryClient();
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [programForm, setProgramForm] = useState(emptyProgramForm);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);
  const [editingBatchId, setEditingBatchId] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [calendarForm, setCalendarForm] = useState(emptyCalendarForm);
  const [editingCalendarId, setEditingCalendarId] = useState("");
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState("");
  const [error, setError] = useState("");

  const info = useQuery({
    queryKey: ["manager-official-info"],
    queryFn: () => api.get("/universities/manager/official-info").then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["manager-official-info"] });

  const university = info.data?.university;
  const colleges = useMemo(() => info.data?.colleges ?? [], [info.data?.colleges]);
  const departments = useMemo(() => info.data?.departments ?? [], [info.data?.departments]);
  const hasUnassignedDepartments = useMemo(
    () => departments.some((department) => !department.collegeId),
    [departments]
  );
  const collegeOptions = useMemo(
    () =>
      hasUnassignedDepartments
        ? [...colleges, { id: UNASSIGNED_COLLEGE_ID, name: "Programs not assigned to a college", isVirtual: true }]
        : colleges,
    [colleges, hasUnassignedDepartments]
  );
  const departmentsForCollege = useMemo(
    () =>
      departments.filter((department) =>
        selectedCollegeId === UNASSIGNED_COLLEGE_ID
          ? !department.collegeId
          : department.collegeId === selectedCollegeId
      ),
    [departments, selectedCollegeId]
  );
  const selectedCollege = collegeOptions.find((college) => college.id === selectedCollegeId);
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);
  const courseGroups = useMemo(() => groupedCourses(selectedDepartment?.courses), [selectedDepartment?.courses]);
  const totalSeats = (selectedDepartment?.batches ?? []).reduce((sum, batch) => sum + (batch.capacity || 0), 0);
  const isSelectedRealCollege = selectedCollegeId && selectedCollegeId !== UNASSIGNED_COLLEGE_ID;

  useEffect(() => {
    if (!collegeOptions.length) {
      setSelectedCollegeId("");
      return;
    }
    if (!selectedCollegeId || !collegeOptions.some((college) => college.id === selectedCollegeId)) {
      setSelectedCollegeId(collegeOptions[0].id);
    }
  }, [collegeOptions, selectedCollegeId]);

  useEffect(() => {
    if (!departmentsForCollege.length) {
      setSelectedDepartmentId("");
      return;
    }
    if (!selectedDepartmentId || !departmentsForCollege.some((department) => department.id === selectedDepartmentId)) {
      setSelectedDepartmentId(departmentsForCollege[0].id);
    }
  }, [departmentsForCollege, selectedDepartmentId]);

  useEffect(() => {
    if (!selectedDepartment) {
      setProgramForm({ ...emptyProgramForm, collegeId: selectedCollegeId });
      setBatchForm(emptyBatchForm);
      setEditingBatchId("");
      setCourseForm(emptyCourseForm);
      setEditingCourseId("");
      return;
    }

    setProgramForm({
      name: selectedDepartment.name || "",
      collegeId: selectedDepartment.collegeId || "",
      durationYears: selectedDepartment.durationYears ? String(selectedDepartment.durationYears) : "",
      degreeAwarded: selectedDepartment.degreeAwarded || "",
      programOverview: selectedDepartment.programOverview || "",
      admissionRequirements: selectedDepartment.admissionRequirements || "",
    });
    setBatchForm(emptyBatchForm);
    setEditingBatchId("");
    setCourseForm((form) => ({
      ...emptyCourseForm,
      year: yearOptions(selectedDepartment.durationYears)[0] || form.year || "1",
    }));
    setEditingCourseId("");
  }, [selectedDepartment, selectedCollegeId]);

  const createCollege = useMutation({
    mutationFn: (name) => api.post(`/universities/${university.id}/colleges`, { name }),
    onSuccess: (response) => {
      setNewCollegeName("");
      setError("");
      setSelectedCollegeId(response.data.id);
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not add college")),
  });

  const updateCollege = useMutation({
    mutationFn: ({ id, name }) => api.patch(`/universities/colleges/${id}`, { name }),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not update college")),
  });

  const deleteCollege = useMutation({
    mutationFn: (id) => api.delete(`/universities/colleges/${id}`),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not delete college")),
  });

  const createDepartment = useMutation({
    mutationFn: (data) => api.post(`/universities/${university.id}/departments`, data),
    onSuccess: (response) => {
      setNewDepartmentName("");
      setError("");
      setSelectedDepartmentId(response.data.id);
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not add department or program")),
  });

  const updateDepartment = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/universities/departments/${id}`, data),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not save program details")),
  });

  const deleteDepartment = useMutation({
    mutationFn: (id) => api.delete(`/universities/departments/${id}`),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not delete department or program")),
  });

  const saveBatch = useMutation({
    mutationFn: (form) =>
      editingBatchId
        ? api.patch(`/universities/batches/${editingBatchId}`, form)
        : api.post(`/universities/departments/${selectedDepartment.id}/batches`, form),
    onSuccess: () => {
      setBatchForm(emptyBatchForm);
      setEditingBatchId("");
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not save batch")),
  });

  const deleteBatch = useMutation({
    mutationFn: (id) => api.delete(`/universities/batches/${id}`),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not delete batch")),
  });

  const saveCourse = useMutation({
    mutationFn: (form) =>
      editingCourseId
        ? api.patch(`/universities/courses/${editingCourseId}`, form)
        : api.post(`/universities/departments/${selectedDepartment.id}/courses`, form),
    onSuccess: () => {
      setCourseForm((form) => ({ ...emptyCourseForm, year: form.year, semester: form.semester }));
      setEditingCourseId("");
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not save course")),
  });

  const deleteCourse = useMutation({
    mutationFn: (id) => api.delete(`/universities/courses/${id}`),
    onSuccess: () => {
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not delete course")),
  });

  const saveCalendar = useMutation({
    mutationFn: (form) =>
      editingCalendarId
        ? api.patch(`/universities/manager/calendar/${editingCalendarId}`, form)
        : api.post("/universities/manager/calendar", form),
    onSuccess: () => {
      setCalendarForm(emptyCalendarForm);
      setEditingCalendarId("");
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not save calendar item")),
  });

  const deleteCalendar = useMutation({
    mutationFn: (id) => api.delete(`/universities/manager/calendar/${id}`),
    onSuccess: invalidate,
    onError: (err) => setError(getErrorMessage(err, "Could not delete calendar item")),
  });

  const saveAnnouncement = useMutation({
    mutationFn: (form) =>
      editingAnnouncementId
        ? api.patch(`/universities/manager/announcements/${editingAnnouncementId}`, form)
        : api.post("/universities/manager/announcements", form),
    onSuccess: () => {
      setAnnouncementForm(emptyAnnouncementForm);
      setEditingAnnouncementId("");
      setError("");
      invalidate();
    },
    onError: (err) => setError(getErrorMessage(err, "Could not save announcement")),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id) => api.delete(`/universities/manager/announcements/${id}`),
    onSuccess: invalidate,
    onError: (err) => setError(getErrorMessage(err, "Could not delete announcement")),
  });

  const onCollegeSubmit = (e) => {
    e.preventDefault();
    const name = newCollegeName.trim();
    if (!name) return setError("College name is required.");
    setError("");
    createCollege.mutate(name);
  };

  const onCollegeRename = () => {
    const nextName = window.prompt("College name", selectedCollege?.name || "");
    if (!nextName?.trim() || !selectedCollege) return;
    setError("");
    updateCollege.mutate({ id: selectedCollege.id, name: nextName.trim() });
  };

  const onDepartmentSubmit = (e) => {
    e.preventDefault();
    if (!isSelectedRealCollege) return setError("Select or add a college first.");
    const name = newDepartmentName.trim();
    if (!name) return setError("Department or program name is required.");
    setError("");
    createDepartment.mutate({ name, collegeId: selectedCollegeId });
  };

  const onProgramSubmit = (e) => {
    e.preventDefault();
    if (!selectedDepartment) return setError("Select or add a department or program first.");
    if (!programForm.name.trim()) return setError("Program name is required.");

    setError("");
    updateDepartment.mutate({
      id: selectedDepartment.id,
      data: {
        ...programForm,
        name: programForm.name.trim(),
        collegeId: programForm.collegeId || null,
        durationYears: programForm.durationYears ? Number(programForm.durationYears) : null,
      },
    });
  };

  const onBatchSubmit = (e) => {
    e.preventDefault();
    if (!selectedDepartment) return setError("Select a department or program first.");
    if (!batchForm.admissionYear.trim()) return setError("Batch year is required.");

    setError("");
    saveBatch.mutate({
      admissionYear: batchForm.admissionYear.trim(),
      capacity: batchForm.capacity ? Number(batchForm.capacity) : null,
      notes: batchForm.notes,
    });
  };

  const onCourseSubmit = (e) => {
    e.preventDefault();
    if (!selectedDepartment) return setError("Select a department or program first.");
    if (!courseForm.title.trim()) return setError("Course title is required.");
    if (!courseForm.year || !courseForm.semester) return setError("Course year and semester are required.");

    setError("");
    saveCourse.mutate({
      title: courseForm.title.trim(),
      code: courseForm.code,
      year: Number(courseForm.year),
      semester: Number(courseForm.semester),
    });
  };

  const onCalendarSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!calendarForm.startDate) return setError("Start date is required.");
    if (calendarForm.endDate && calendarForm.endDate < calendarForm.startDate) {
      return setError("End date cannot be before start date.");
    }
    saveCalendar.mutate(calendarForm);
  };

  const onAnnouncementSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!announcementForm.title.trim()) return setError("Announcement title is required.");
    saveAnnouncement.mutate(announcementForm);
  };

  if (info.isLoading) return <p className="page-shell py-12 text-sm text-muted">Loading manager workspace...</p>;

  if (info.isError) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">This manager account is not assigned to an active university.</div>
      </div>
    );
  }

  const calendarEvents = info.data?.calendarEvents ?? [];
  const announcements = info.data?.announcements ?? [];

  return (
    <div className="page-shell py-10">
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Megaphone size={16} />
          University Manager
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">{university?.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Maintain the program catalog, admissions batches, capacities, course plan, calendar dates, and announcements.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
          {error}
        </div>
      )}

      <section className="section-panel rounded-xl p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland dark:bg-highland/20">
              <Layers3 size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink">Program Catalog</h2>
              <p className="text-sm text-muted">College, department, batch, capacity, year, semester, and course records.</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[420px]">
            <SummaryTile label="Colleges" value={colleges.length} />
            <SummaryTile label="Programs" value={departments.length} />
            <SummaryTile label="Selected Seats" value={totalSeats || "-"} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-lg border border-line bg-paper p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="field-label mb-0">College</label>
                {selectedCollege && !selectedCollege.isVirtual && (
                  <div className="flex gap-2">
                    <button type="button" onClick={onCollegeRename} className="btn-secondary min-h-9 px-3 py-1.5">
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${selectedCollege.name}"? Departments under it will become unassigned.`)) {
                          deleteCollege.mutate(selectedCollege.id);
                        }
                      }}
                      className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="select-field"
              >
                <option value="">Select college</option>
                {collegeOptions.map((college) => (
                  <option key={college.id} value={college.id}>{college.name}</option>
                ))}
              </select>
              <form onSubmit={onCollegeSubmit} className="mt-3 flex gap-2">
                <input
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="Add college"
                  className="input-field"
                />
                <button disabled={createCollege.isPending} className="btn-dark shrink-0 px-3">
                  <Plus size={16} />
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-line bg-paper p-4">
              <label className="field-label">Department / Program</label>
              <form onSubmit={onDepartmentSubmit} className="mb-3 flex gap-2">
                <input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Add program"
                  className="input-field"
                />
                <button disabled={createDepartment.isPending} className="btn-dark shrink-0 px-3">
                  <Plus size={16} />
                </button>
              </form>
              {departmentsForCollege.length === 0 && (
                <div className="empty-state py-6">No departments or programs in this college yet.</div>
              )}
              <div className="space-y-2">
                {departmentsForCollege.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => setSelectedDepartmentId(department.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      selectedDepartmentId === department.id
                        ? "border-highland bg-white text-highland dark:bg-dark-surface"
                        : "border-line bg-white text-ink hover:border-highland/50 dark:bg-dark-surface dark:text-dark-text"
                    }`}
                  >
                    <span className="block font-semibold">{department.name}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {department.durationYears ? `${department.durationYears} years` : "Duration not set"} - {department.courses?.length || 0} courses
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            {!selectedDepartment ? (
              <div className="empty-state">Select or add a college and department/program to manage catalog details.</div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <SummaryTile label="College" value={selectedCollege?.name || "-"} />
                  <SummaryTile label="Duration" value={selectedDepartment.durationYears ? `${selectedDepartment.durationYears} years` : "-"} />
                  <SummaryTile label="Batches" value={selectedDepartment.batches?.length || 0} />
                  <SummaryTile label="Courses" value={selectedDepartment.courses?.length || 0} />
                </div>

                <form onSubmit={onProgramSubmit} className="rounded-lg border border-line bg-white p-5 dark:bg-dark-surface dark:border-dark-border">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink">Program Details</h3>
                        <p className="mt-1 text-sm text-muted">Basic information shown to students before they join.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${selectedDepartment.name}" and its batches/courses?`)) {
                          deleteDepartment.mutate(selectedDepartment.id);
                        }
                      }}
                      className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="field-label">Department / Program name *</label>
                      <input
                        value={programForm.name}
                        onChange={(e) => setProgramForm((form) => ({ ...form, name: e.target.value }))}
                        required
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">College</label>
                      <select
                        value={programForm.collegeId}
                        onChange={(e) => setProgramForm((form) => ({ ...form, collegeId: e.target.value }))}
                        className="select-field"
                      >
                        <option value="">No college assigned</option>
                        {colleges.map((college) => (
                          <option key={college.id} value={college.id}>{college.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Program duration</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={programForm.durationYears}
                        onChange={(e) => setProgramForm((form) => ({ ...form, durationYears: e.target.value }))}
                        placeholder="4"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label">Degree / credential</label>
                      <input
                        value={programForm.degreeAwarded}
                        onChange={(e) => setProgramForm((form) => ({ ...form, degreeAwarded: e.target.value }))}
                        placeholder="BSc in Computer Science"
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="field-label">Program overview</label>
                      <textarea
                        value={programForm.programOverview}
                        onChange={(e) => setProgramForm((form) => ({ ...form, programOverview: e.target.value }))}
                        rows={4}
                        className="input-field resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="field-label">Admission requirements / basic information</label>
                      <textarea
                        value={programForm.admissionRequirements}
                        onChange={(e) => setProgramForm((form) => ({ ...form, admissionRequirements: e.target.value }))}
                        rows={4}
                        className="input-field resize-none"
                      />
                    </div>
                  </div>
                  <button disabled={updateDepartment.isPending} className="btn-dark mt-4">
                    <Save size={16} />
                    Save program details
                  </button>
                </form>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-lg border border-line bg-white p-5 dark:bg-dark-surface dark:border-dark-border">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-highland-light text-highland dark:bg-highland/20">
                        <UsersRound size={18} />
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">Admission Batches</h3>
                        <p className="text-sm text-muted">Batch year and student capacity.</p>
                      </div>
                    </div>

                    <form onSubmit={onBatchSubmit} className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="field-label">Batch / admission year *</label>
                        <input
                          value={batchForm.admissionYear}
                          onChange={(e) => setBatchForm((form) => ({ ...form, admissionYear: e.target.value }))}
                          placeholder="2026"
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={batchForm.capacity}
                          onChange={(e) => setBatchForm((form) => ({ ...form, capacity: e.target.value }))}
                          placeholder="60"
                          className="input-field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="field-label">Notes</label>
                        <input
                          value={batchForm.notes}
                          onChange={(e) => setBatchForm((form) => ({ ...form, notes: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div className="flex gap-2 sm:col-span-2">
                        <button disabled={saveBatch.isPending} className="btn-dark">
                          <Plus size={16} />
                          {editingBatchId ? "Update batch" : "Add batch"}
                        </button>
                        {editingBatchId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBatchId("");
                              setBatchForm(emptyBatchForm);
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="mt-5 space-y-2">
                      {selectedDepartment.batches?.length === 0 && <div className="empty-state py-6">No batches yet.</div>}
                      {selectedDepartment.batches?.map((batch) => (
                        <div key={batch.id} className="flex items-start justify-between gap-3 rounded-lg border border-line bg-paper p-3 text-sm">
                          <div>
                            <p className="font-semibold text-ink">Batch {batch.admissionYear}</p>
                            <p className="mt-1 text-xs text-muted">
                              {batch.capacity ? `${batch.capacity} seats` : "Capacity not set"}
                            </p>
                            {batch.notes && <p className="mt-2 text-sm text-muted">{batch.notes}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBatchId(batch.id);
                                setBatchForm({
                                  admissionYear: batch.admissionYear,
                                  capacity: batch.capacity ? String(batch.capacity) : "",
                                  notes: batch.notes || "",
                                });
                              }}
                              className="btn-secondary min-h-9 px-3 py-1.5"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBatch.mutate(batch.id)}
                              className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-lg border border-line bg-white p-5 dark:bg-dark-surface dark:border-dark-border">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-highland-light text-highland dark:bg-highland/20">
                        <BookOpen size={18} />
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">Courses</h3>
                        <p className="text-sm text-muted">Academic year and semester course plan.</p>
                      </div>
                    </div>

                    <form onSubmit={onCourseSubmit} className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="field-label">Course title *</label>
                        <input
                          value={courseForm.title}
                          onChange={(e) => setCourseForm((form) => ({ ...form, title: e.target.value }))}
                          placeholder="Introduction to Programming"
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label">Course code</label>
                        <input
                          value={courseForm.code}
                          onChange={(e) => setCourseForm((form) => ({ ...form, code: e.target.value }))}
                          placeholder="CoSc101"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label">Academic year *</label>
                        <select
                          value={courseForm.year}
                          onChange={(e) => setCourseForm((form) => ({ ...form, year: e.target.value }))}
                          className="select-field"
                        >
                          {yearOptions(programForm.durationYears).map((year) => (
                            <option key={year} value={year}>{ordinal(year)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Semester *</label>
                        <select
                          value={courseForm.semester}
                          onChange={(e) => setCourseForm((form) => ({ ...form, semester: e.target.value }))}
                          className="select-field"
                        >
                          {SEMESTERS.map((semester) => (
                            <option key={semester.value} value={semester.value}>{semester.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 self-end">
                        <button disabled={saveCourse.isPending} className="btn-dark">
                          <Plus size={16} />
                          {editingCourseId ? "Update course" : "Add course"}
                        </button>
                        {editingCourseId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourseId("");
                              setCourseForm(emptyCourseForm);
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="mt-5 space-y-4">
                      {selectedDepartment.courses?.length === 0 && <div className="empty-state py-6">No courses yet.</div>}
                      {courseGroups.map((group) => (
                        <div key={`${group.year}-${group.semester}`} className="rounded-lg border border-line bg-paper p-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-muted">
                            {ordinal(group.year)} - {semesterLabel(group.semester)}
                          </p>
                          <div className="space-y-2">
                            {group.courses.map((course) => (
                              <div key={course.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm dark:bg-dark-surface">
                                <div>
                                  <p className="font-semibold text-ink dark:text-dark-text">{course.title}</p>
                                  {course.code && <p className="text-xs text-muted dark:text-dark-muted">{course.code}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCourseId(course.id);
                                      setCourseForm({
                                        title: course.title,
                                        code: course.code || "",
                                        year: course.year ? String(course.year) : "1",
                                        semester: course.semester ? String(course.semester) : "1",
                                      });
                                    }}
                                    className="btn-secondary min-h-9 px-3 py-1.5"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCourse.mutate(course.id)}
                                    className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="section-panel rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland dark:bg-highland/20">
              <CalendarDays size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Academic Calendar</h2>
              <p className="text-sm text-muted">Semester dates, deadlines, exam periods, holidays, and graduation dates.</p>
            </div>
          </div>

          <form onSubmit={onCalendarSubmit} className="space-y-4">
            <div>
              <label className="field-label">Calendar item *</label>
              <select
                value={calendarForm.type}
                onChange={(e) => setCalendarForm((form) => ({ ...form, type: e.target.value }))}
                className="select-field"
              >
                {CALENDAR_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Title or note</label>
              <input
                value={calendarForm.title}
                onChange={(e) => setCalendarForm((form) => ({ ...form, title: e.target.value }))}
                placeholder="Undergraduate registration"
                className="input-field"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Start date *</label>
                <input
                  type="date"
                  value={calendarForm.startDate}
                  onChange={(e) => setCalendarForm((form) => ({ ...form, startDate: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">End date</label>
                <input
                  type="date"
                  value={calendarForm.endDate}
                  onChange={(e) => setCalendarForm((form) => ({ ...form, endDate: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={saveCalendar.isPending} className="btn-dark">
                <Plus size={16} />
                {editingCalendarId ? "Update calendar item" : "Add calendar item"}
              </button>
              {editingCalendarId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCalendarId("");
                    setCalendarForm(emptyCalendarForm);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {calendarEvents.length === 0 && <div className="empty-state">No calendar information has been published yet.</div>}
            {calendarEvents.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted">{typeLabel(item.type)}</p>
                    <p className="mt-1 font-semibold text-ink">{formatRange(item)}</p>
                    {item.title && <p className="mt-2 text-sm text-muted">{item.title}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCalendarId(item.id);
                        setCalendarForm({
                          type: item.type,
                          title: item.title || "",
                          startDate: toDateInput(item.startDate),
                          endDate: toDateInput(item.endDate),
                        });
                      }}
                      className="btn-secondary min-h-9 px-3 py-1.5"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCalendar.mutate(item.id)}
                      className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-panel rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland dark:bg-highland/20">
              <Megaphone size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Important Announcements</h2>
              <p className="text-sm text-muted">Official notices and student-related information.</p>
            </div>
          </div>

          <form onSubmit={onAnnouncementSubmit} className="space-y-4">
            <div>
              <label className="field-label">Title *</label>
              <input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm((form) => ({ ...form, title: e.target.value }))}
                placeholder="Final Examination Announcement"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Details</label>
              <textarea
                value={announcementForm.body}
                onChange={(e) => setAnnouncementForm((form) => ({ ...form, body: e.target.value }))}
                rows={4}
                className="input-field resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={saveAnnouncement.isPending} className="btn-dark">
                <Plus size={16} />
                {editingAnnouncementId ? "Update announcement" : "Publish announcement"}
              </button>
              {editingAnnouncementId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnnouncementId("");
                    setAnnouncementForm(emptyAnnouncementForm);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {announcements.length === 0 && <div className="empty-state">No announcements have been published yet.</div>}
            {announcements.map((item) => (
              <article key={item.id} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    {item.body && <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>}
                    <p className="mt-3 text-xs font-semibold text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnouncementId(item.id);
                        setAnnouncementForm({ title: item.title, body: item.body || "" });
                      }}
                      className="btn-secondary min-h-9 px-3 py-1.5"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement.mutate(item.id)}
                      className="btn-secondary min-h-9 border-ember/30 px-3 py-1.5 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-3">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
