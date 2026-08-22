import { useState } from "react";
import { MapPin, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

export default function AcademicRoadmap() {
  const [roadmap, setRoadmap] = useState([
    {
      id: 1,
      semester: "Year 1 - Semester 1",
      courses: [
        { id: 1, name: "Introduction to Computer Science", completed: true },
        { id: 2, name: "Calculus I", completed: true },
        { id: 3, name: "English Composition", completed: false },
      ],
    },
    {
      id: 2,
      semester: "Year 1 - Semester 2",
      courses: [
        { id: 1, name: "Data Structures", completed: false },
        { id: 2, name: "Calculus II", completed: false },
        { id: 3, name: "Discrete Mathematics", completed: false },
      ],
    },
  ]);

  const [newSemester, setNewSemester] = useState("");
  const [newCourse, setNewCourse] = useState({ semesterId: null, name: "" });

  const addSemester = () => {
    if (!newSemester.trim()) return;
    setRoadmap([
      ...roadmap,
      {
        id: Date.now(),
        semester: newSemester,
        courses: [],
      },
    ]);
    setNewSemester("");
  };

  const removeSemester = (id) => {
    setRoadmap(roadmap.filter((sem) => sem.id !== id));
  };

  const addCourse = () => {
    if (!newCourse.semesterId || !newCourse.name.trim()) return;
    setRoadmap(
      roadmap.map((sem) =>
        sem.id === newCourse.semesterId
          ? {
              ...sem,
              courses: [
                ...sem.courses,
                { id: Date.now(), name: newCourse.name, completed: false },
              ],
            }
          : sem
      )
    );
    setNewCourse({ semesterId: null, name: "" });
  };

  const removeCourse = (semesterId, courseId) => {
    setRoadmap(
      roadmap.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              courses: sem.courses.filter((course) => course.id !== courseId),
            }
          : sem
      )
    );
  };

  const toggleCourse = (semesterId, courseId) => {
    setRoadmap(
      roadmap.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              courses: sem.courses.map((course) =>
                course.id === courseId
                  ? { ...course, completed: !course.completed }
                  : course
              ),
            }
          : sem
      )
    );
  };

  const calculateProgress = () => {
    const totalCourses = roadmap.reduce(
      (sum, sem) => sum + sem.courses.length,
      0
    );
    const completedCourses = roadmap.reduce(
      (sum, sem) => sum + sem.courses.filter((c) => c.completed).length,
      0
    );
    return totalCourses > 0
      ? Math.round((completedCourses / totalCourses) * 100)
      : 0;
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <MapPin size={16} />
          Academic Tools
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Academic Roadmap</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Plan and track your academic journey through semesters and courses.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Overall Progress</h2>
            <div className="text-right">
              <span className="text-3xl font-bold text-highland">{calculateProgress()}%</span>
              <p className="text-sm text-muted">Completed</p>
            </div>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full bg-highland transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-6 text-lg font-semibold text-ink">Add New Semester</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newSemester}
              onChange={(e) => setNewSemester(e.target.value)}
              placeholder="e.g., Year 2 - Semester 1"
              className="input-field flex-1"
            />
            <button onClick={addSemester} className="btn-dark">
              <Plus size={16} />
              Add Semester
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {roadmap.map((semester) => (
            <div key={semester.id} className="section-panel rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">{semester.semester}</h3>
                <button
                  onClick={() => removeSemester(semester.id)}
                  className="btn-ghost border-ember/30 text-ember hover:border-ember hover:text-ember"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>

              <div className="mb-4 space-y-2">
                {semester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border border-line bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCourse(semester.id, course.id)}
                        className="text-highland"
                      >
                        {course.completed ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                      <span
                        className={`font-semibold ${
                          course.completed ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        {course.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCourse(semester.id, course.id)}
                      className="btn-ghost border-ember/30 text-ember hover:border-ember hover:text-ember"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <select
                  value={newCourse.semesterId === semester.id ? semester.id : ""}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, semesterId: parseInt(e.target.value) })
                  }
                  className="select-field flex-1"
                >
                  <option value="">Select this semester to add course</option>
                  <option value={semester.id}>{semester.semester}</option>
                </select>
                <input
                  type="text"
                  value={newCourse.semesterId === semester.id ? newCourse.name : ""}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, name: e.target.value })
                  }
                  placeholder="Course name"
                  className="input-field flex-1"
                  disabled={newCourse.semesterId !== semester.id}
                />
                <button
                  onClick={addCourse}
                  className="btn-secondary"
                  disabled={newCourse.semesterId !== semester.id}
                >
                  <Plus size={16} />
                  Add Course
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
