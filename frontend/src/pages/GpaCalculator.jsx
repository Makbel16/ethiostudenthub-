import { useState } from "react";
import { Calculator, Plus, Trash2, Award, TrendingUp, Sparkles, BookOpen } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-highland/10 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="page-shell relative py-12 sm:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-highland/30 bg-white/80 px-4 py-2 text-sm font-semibold text-highland shadow-lg backdrop-blur-sm dark:bg-dark-surface/80 dark:border-highland/40">
            <Sparkles size={16} className="animate-pulse" />
            Academic Tools
          </div>
          <h1 className="font-display text-5xl font-bold text-ink dark:text-dark-text">
            GPA/CGPA
            <span className="block bg-gradient-to-r from-highland to-blue-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted dark:text-dark-muted">
            Calculate your Grade Point Average and Cumulative GPA by entering your courses, credits, and grades.
          </p>
        </div>
      </section>

      <div className="page-shell pb-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main Content */}
          <section className="space-y-6">
            {/* Course Input Section */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              {/* 3D gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-highland/5 to-blue-500/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-highland/10 to-highland/20 text-highland shadow-inner">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text">Your Courses</h2>
                      <p className="text-sm text-muted dark:text-dark-muted">Add your courses to calculate GPA</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addCourse} className="btn-primary inline-flex items-center gap-2">
                      <Plus size={18} />
                      Add Course
                    </button>
                    <button onClick={resetCalculator} className="btn-secondary inline-flex items-center gap-2">
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {courses.map((course, index) => (
                    <div key={course.id} className="group relative overflow-hidden rounded-xl border border-line bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:border-highland/50 dark:border-dark-border dark:bg-dark-surface">
                      {/* Animated background pattern */}
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-highland/5 to-blue-500/5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-150" />
                      
                      <div className="relative grid gap-4 sm:grid-cols-4">
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
                            className="btn-ghost w-full border-amber-300 text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-all duration-300 hover:scale-105"
                            disabled={courses.length === 1}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade Scale Reference */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              {/* 3D gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/20 text-purple-600 shadow-inner">
                    <Award size={24} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text">Grade Scale Reference</h2>
                    <p className="text-sm text-muted dark:text-dark-muted">Standard grade point values</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(gradePoints).map(([grade, points]) => (
                    <div key={grade} className="group relative overflow-hidden rounded-xl border border-line bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:border-purple-300 dark:border-dark-border dark:bg-dark-surface dark:hover:border-purple-500/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink dark:text-dark-text transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {gradeLabels[grade]}
                        </span>
                        <span className="text-muted dark:text-dark-muted transition-colors duration-300 group-hover:text-purple-500 dark:group-hover:text-purple-300">
                          {points} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Results Sidebar */}
          <aside className="space-y-6">
            {/* Results Card */}
            <div className="relative overflow-hidden rounded-2xl border border-highland/30 bg-gradient-to-br from-highland/5 to-blue-500/5 p-6 shadow-xl dark:border-highland/40 dark:from-highland/10 dark:to-blue-500/10">
              {/* Animated background pattern */}
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-highland/10 to-blue-500/10 opacity-50 animate-pulse" />
              
              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-highland to-highland-dark text-white shadow-lg">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text">Results</h2>
                    <p className="text-sm text-muted dark:text-dark-muted">Your calculated GPA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-line bg-white/50 p-4 backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/50">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">Total Credits</dt>
                    <dd className="mt-2 font-display text-3xl font-bold text-ink dark:text-dark-text transition-transform duration-300 hover:scale-110">{totalCredits}</dd>
                  </div>
                  <div className="rounded-xl border border-line bg-white/50 p-4 backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/50">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">Total Points</dt>
                    <dd className="mt-2 font-display text-3xl font-bold text-ink dark:text-dark-text transition-transform duration-300 hover:scale-110">{totalPoints.toFixed(2)}</dd>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border-2 border-highland/30 bg-gradient-to-br from-highland to-highland-dark p-5 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-white/80">GPA</dt>
                        <dd className="mt-2 font-display text-5xl font-bold text-white transition-transform duration-300 hover:scale-110">{gpa}</dd>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
                        <TrendingUp size={32} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-highland" />
                <h3 className="font-display font-semibold text-ink dark:text-dark-text">Tips</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted dark:text-dark-muted">
                <li className="flex gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highland/10 text-highland text-xs font-bold">1</div>
                  <span>Enter accurate credit hours for each course</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highland/10 text-highland text-xs font-bold">2</div>
                  <span>Select the correct grade from the dropdown</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highland/10 text-highland text-xs font-bold">3</div>
                  <span>GPA updates automatically as you add courses</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
