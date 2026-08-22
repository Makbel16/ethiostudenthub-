import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";

export default function GpaCalculator() {
  const [courses, setCourses] = useState([
    { id: 1, name: "", credit: "", grade: "" },
  ]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [gpa, setGpa] = useState(0);

  const gradePoints = {
    A: 4.0,
    A_minus: 3.7,
    B_plus: 3.3,
    B: 3.0,
    B_minus: 2.7,
    C_plus: 2.3,
    C: 2.0,
    C_minus: 1.7,
    D_plus: 1.3,
    D: 1.0,
    F: 0.0,
  };

  const gradeLabels = {
    A: "A",
    A_minus: "A-",
    B_plus: "B+",
    B: "B",
    B_minus: "B-",
    C_plus: "C+",
    C: "C",
    C_minus: "C-",
    D_plus: "D+",
    D: "D",
    F: "F",
  };

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), name: "", credit: "", grade: "" }]);
  };

  const removeCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
    calculateGpa(courses.filter((course) => course.id !== id));
  };

  const updateCourse = (id, field, value) => {
    const updatedCourses = courses.map((course) =>
      course.id === id ? { ...course, [field]: value } : course
    );
    setCourses(updatedCourses);
    calculateGpa(updatedCourses);
  };

  const calculateGpa = (courseList) => {
    let credits = 0;
    let points = 0;

    courseList.forEach((course) => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        const creditValue = parseFloat(course.credit);
        const pointValue = gradePoints[course.grade];
        credits += creditValue;
        points += creditValue * pointValue;
      }
    });

    setTotalCredits(credits);
    setTotalPoints(points);
    setGpa(credits > 0 ? (points / credits).toFixed(2) : 0);
  };

  const resetCalculator = () => {
    setCourses([{ id: 1, name: "", credit: "", grade: "" }]);
    setTotalCredits(0);
    setTotalPoints(0);
    setGpa(0);
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
          <Calculator size={16} />
          Academic Tools
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">GPA/CGPA Calculator</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Calculate your Grade Point Average and Cumulative GPA by entering your courses, credits, and grades.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Your Courses</h2>
            <div className="flex gap-2">
              <button onClick={addCourse} className="btn-secondary">
                <Plus size={16} />
                Add Course
              </button>
              <button onClick={resetCalculator} className="btn-ghost">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="grid gap-4 rounded-lg border border-line bg-paper p-4 sm:grid-cols-4">
                <div className="sm:col-span-1">
                  <label className="field-label">Course Name</label>
                  <input
                    type="text"
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Credit Hours</label>
                  <input
                    type="number"
                    value={course.credit}
                    onChange={(e) => updateCourse(course.id, "credit", e.target.value)}
                    placeholder="3"
                    min="0"
                    step="0.5"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Grade</label>
                  <select
                    value={course.grade}
                    onChange={(e) => updateCourse(course.id, "grade", e.target.value)}
                    className="select-field"
                  >
                    <option value="">Select Grade</option>
                    {Object.keys(gradePoints).map((grade) => (
                      <option key={grade} value={grade}>
                        {gradeLabels[grade]} ({gradePoints[grade]})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="btn-ghost w-full border-ember/30 text-ember hover:border-ember hover:text-ember"
                    disabled={courses.length === 1}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-6 text-lg font-semibold text-ink">Results</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-paper p-4">
              <dt className="text-xs font-semibold uppercase text-muted">Total Credits</dt>
              <dd className="mt-2 text-3xl font-bold text-ink">{totalCredits}</dd>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <dt className="text-xs font-semibold uppercase text-muted">Total Points</dt>
              <dd className="mt-2 text-3xl font-bold text-ink">{totalPoints.toFixed(2)}</dd>
            </div>
            <div className="rounded-lg border border-highland/30 bg-highland/5 p-4">
              <dt className="text-xs font-semibold uppercase text-highland">GPA</dt>
              <dd className="mt-2 text-3xl font-bold text-highland">{gpa}</dd>
            </div>
          </div>
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Grade Scale Reference</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(gradePoints).map(([grade, points]) => (
              <div key={grade} className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-2">
                <span className="font-semibold text-ink">{gradeLabels[grade]}</span>
                <span className="text-muted">{points} points</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
