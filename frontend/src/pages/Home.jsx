import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const STATS = [
  { label: "Universities", value: "40+" },
  { label: "Students", value: "12,000+" },
  { label: "Resources", value: "8,500+" },
  { label: "Previous exams", value: "3,200+" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/browse${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <p className="course-tab text-highland text-sm mb-4">COSC / MATH / PHYS / ECON / LAW — EVERY DEPARTMENT, EVERY YEAR</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight max-w-3xl text-ink">
          The shared notebook for Ethiopian university students.
        </h1>
        <p className="mt-6 text-lg text-ink/70 max-w-2xl margin-rule">
          Previous exams, lecture notes, and past students' work — organized by university,
          department, and course. Find what your seniors left behind, and leave something for
          the class behind you.
        </p>

        <form onSubmit={onSearch} className="mt-10 flex max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search “CoSc2012 final exam” or “Bahir Dar thermodynamics notes”"
            className="flex-1 border border-line bg-white px-4 py-3 text-sm rounded-l-sm focus:outline-none focus:border-highland"
          />
          <button
            type="submit"
            className="bg-ink text-paper px-5 rounded-r-sm hover:bg-highland transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>

        <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="text-xs course-tab text-ink/50">{s.label.toUpperCase()}</dt>
              <dd className="font-display text-3xl mt-1 text-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-line">
        <h2 className="font-display text-2xl font-semibold mb-2">Trending this week</h2>
        <p className="text-ink/60 mb-8">Popular uploads across all universities right now.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-line rounded-sm p-5 bg-white hover:border-highland transition-colors">
              <p className="course-tab text-xs text-highland mb-2">PREVIOUS EXAM</p>
              <p className="font-medium">Data Structures — Final Exam 2024</p>
              <p className="text-sm text-ink/60 mt-1">Addis Ababa University · Computer Science</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
