import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  Calculator,
  Building2,
  CheckCircle2,
  Download,
  ArrowRight,
  Star,
  ExternalLink,
  Bot,
  Zap,
  TrendingUp,
  Award,
  Layers,
  GraduationCap,
} from "lucide-react";

const SAMPLE_EXAMS = [
  {
    code: "CoSc2012",
    title: "Data Structures & Algorithms Final Exam",
    university: "Addis Ababa University (AAiT)",
    dept: "Computer Science",
    term: "2024 • Year 2 Sem II",
    pages: "8 Pages",
    downloads: "1,840",
    rating: "4.9",
    verified: true,
    type: "PREVIOUS EXAM",
  },
  {
    code: "Ingeg2041",
    title: "Applied Engineering Mechanics (Statics) Midterm",
    university: "Adama Science & Tech (ASTU)",
    dept: "Mechanical Engineering",
    term: "2024 • Year 2 Sem I",
    pages: "5 Pages",
    downloads: "2,310",
    rating: "4.8",
    verified: true,
    type: "PREVIOUS EXAM",
  },
  {
    code: "Med3021",
    title: "Pathology & Systemic Pathophysiology Block II",
    university: "Jimma University (Institute of Health)",
    dept: "School of Medicine",
    term: "2023 • Year 3 Sem I",
    pages: "14 Pages",
    downloads: "3,120",
    rating: "5.0",
    verified: true,
    type: "PREVIOUS EXAM",
  },
  {
    code: "Econ2011",
    title: "Intermediate Microeconomic Theory Final Exam",
    university: "Hawassa University",
    dept: "Economics & Finance",
    term: "2024 • Year 2 Sem I",
    pages: "6 Pages",
    downloads: "1,220",
    rating: "4.7",
    verified: true,
    type: "PREVIOUS EXAM",
  },
];

const AI_PROMPTS = [
  {
    id: "algo",
    label: "Data Structures (AAU)",
    prompt: "Explain how to balance an AVL tree after left-left rotation with Python pseudocode.",
    reply:
      "### AVL Tree Left-Left (LL) Rotation\nWhen an insertion in the left subtree of the left child causes an imbalance (balance factor > 1):\n\n```python\ndef rotate_right(z):\n    y = z.left\n    T3 = y.right\n    # Perform rotation\n    y.right = z\n    z.left = T3\n    # Update heights\n    z.height = 1 + max(get_height(z.left), get_height(z.right))\n    y.height = 1 + max(get_height(y.left), get_height(y.right))\n    return y  # New root of subtree\n```\n\n**Exam Tip for AAU CoSc2012:** Time complexity is strictly O(1) pointer updates. Always show the balance factor of every node in your written diagrams!",
  },
  {
    id: "mechanics",
    label: "Mechanics (ASTU)",
    prompt: "How do I calculate principal stresses using Mohr's Circle for 2D plane stress?",
    reply:
      "### Mohr's Circle Step-by-Step for ASTU Ingeg2041\n1. **Center of Circle:**  \n   $$C = \\left(\\frac{\\sigma_x + \\sigma_y}{2}, 0\\right)$$\n2. **Radius:**  \n   $$R = \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}$$\n3. **Principal Stresses:**  \n   $$\\sigma_1 = C_x + R, \\quad \\sigma_2 = C_x - R$$\n\n**Key Takeaway:** The maximum in-plane shear stress is simply $\\tau_{\\max} = R$.",
  },
  {
    id: "medicine",
    label: "Medicine (Jimma)",
    prompt: "Give me high-yield differentiators between Nephritic and Nephrotic syndrome.",
    reply:
      "### High-Yield Renal Pathology Table\n- **Nephrotic Syndrome:** Massive proteinuria (>3.5g/24h), severe hypoalbuminemia (<3g/dL), generalized edema, hyperlipidemia, fatty casts in urine.\n- **Nephritic Syndrome:** Inflammatory glomerular injury with hematuria (dysmorphic RBCs + RBC casts), mild proteinuria (<3.5g), oliguria, hypertension, and azotemia.\n\n*Source: Ethiopian National Curriculum Health Sciences Block Review.*",
  },
];

const CAMPUS_PORTALS = [
  { name: "Addis Ababa University", code: "AAU", url: "https://portal.aau.edu.et", type: "SIMS Portal", students: "48,000+" },
  { name: "Adama Science & Tech", code: "ASTU", url: "https://student.astu.edu.et", type: "Registrar Portal", students: "14,000+" },
  { name: "Jimma University", code: "JU", url: "https://estudent.ju.edu.et", type: "E-Student System", students: "38,000+" },
  { name: "Hawassa University", code: "HU", url: "https://portal.hu.edu.et", type: "Student Information", students: "32,000+" },
  { name: "Bahir Dar University", code: "BDU", url: "https://portal.bdu.edu.et", type: "SIS Portal", students: "42,000+" },
  { name: "University of Gondar", code: "UoG", url: "https://portal.uog.edu.et", type: "Student Portal", students: "30,000+" },
];

export default function StudentOSDemo() {
  const [activeTab, setActiveTab] = useState("exams");
  const [selectedPrompt, setSelectedPrompt] = useState(AI_PROMPTS[0]);
  const [creditHours, setCreditHours] = useState(19);
  const [gradeScore, setGradeScore] = useState(3.84);

  // Compute distinction tier
  const getDistinction = (gpa) => {
    if (gpa >= 3.75) return { label: "Very Great Distinction 🏆", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (gpa >= 3.5) return { label: "Great Distinction 🎖️", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (gpa >= 3.25) return { label: "Distinction ⭐", color: "text-blue-500 bg-blue-500/10 border-blue-500/30" };
    return { label: "Good Academic Standing", color: "text-muted bg-mist border-line" };
  };

  const distinction = getDistinction(gradeScore);

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line/80 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-dark-border dark:bg-dark-surface/90">
      {/* Top Header with Window controls and Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-line/80 bg-mist/60 px-5 py-4 dark:border-dark-border dark:bg-dark-border/40">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start mb-3 sm:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted font-mono">
            EthioStudentHub OS • Live Interactive Preview
          </span>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm border border-line dark:bg-dark-surface dark:border-dark-border w-full sm:w-auto overflow-x-auto">
          {[
            { id: "exams", label: "Exam Vault", icon: FileText },
            { id: "ai", label: "Gemini 3.8 AI", icon: Sparkles },
            { id: "gpa", label: "GPA Calculator", icon: Calculator },
            { id: "portals", label: "Campus Portals", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-highland text-white shadow-sm"
                    : "text-muted hover:text-ink dark:text-dark-muted dark:hover:text-white"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 sm:p-8 min-h-[380px]">
        {/* TAB 1: EXAM VAULT */}
        {activeTab === "exams" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink dark:text-white">
                  Curated Past Exams & Solution Vault
                </h3>
                <p className="text-xs sm:text-sm text-muted dark:text-dark-muted">
                  Organized by Ethiopian University, Department, Year, and Semester with peer verification.
                </p>
              </div>
              <Link
                to="/browse?type=PREVIOUS_EXAM"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-highland hover:underline"
              >
                View 15,000+ Exams <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SAMPLE_EXAMS.map((exam) => (
                <div
                  key={exam.code}
                  className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 transition-all hover:border-highland/40 hover:shadow-lg dark:border-dark-border dark:bg-dark-border/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-highland bg-highland/10 px-2 py-0.5 rounded-md dark:bg-highland/20">
                        {exam.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Verified Solution
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-ink dark:text-white group-hover:text-highland transition-colors">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-muted dark:text-dark-muted mt-1">
                      {exam.university} • {exam.dept}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted dark:border-dark-border/60">
                    <span className="font-mono text-[11px]">{exam.term}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Download size={12} /> {exam.downloads}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star size={12} fill="currentColor" /> {exam.rating}
                      </span>
                      <Link
                        to="/browse"
                        className="rounded-lg bg-highland/10 px-2.5 py-1 font-semibold text-highland hover:bg-highland hover:text-white transition-colors text-[11px]"
                      >
                        Preview
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GEMINI 3.8 FLASH AI ASSISTANT */}
        {activeTab === "ai" && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-highland text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink dark:text-white">
                    EthioStudent AI Copilot
                  </h3>
                  <p className="text-xs text-muted dark:text-dark-muted">
                    Powered by Google Gemini 3.8 Flash • Specialized on Ethiopian University Curricula
                  </p>
                </div>
              </div>
              <Link
                to="/ai-assistant"
                className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                Open Full AI Workspace <ArrowRight size={14} />
              </Link>
            </div>

            {/* Prompt selection chips */}
            <div className="flex flex-wrap gap-2">
              {AI_PROMPTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPrompt(item)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
                    selectedPrompt.id === item.id
                      ? "border-highland bg-highland/10 text-highland dark:bg-highland/20 dark:text-emerald-300"
                      : "border-line bg-surface text-muted hover:border-highland/40 dark:border-dark-border dark:bg-dark-surface"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Question card */}
            <div className="rounded-2xl border border-line/80 bg-mist/50 p-4 dark:border-dark-border dark:bg-dark-border/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted mb-1">
                Student Query:
              </p>
              <p className="text-sm font-semibold text-ink dark:text-white">
                "{selectedPrompt.prompt}"
              </p>
            </div>

            {/* AI Generated Answer Box */}
            <div className="relative rounded-2xl border border-highland/30 bg-surface p-5 shadow-sm dark:border-highland/40 dark:bg-dark-surface">
              <div className="absolute top-3 right-4 flex items-center gap-1 text-[11px] font-semibold text-highland dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-highland animate-pulse" />
                Gemini 3.8 Flash • Verified Breakdown
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-ink/90 dark:text-dark-text/90">
                {selectedPrompt.reply}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GPA & DISTINCTION CALCULATOR */}
        {activeTab === "gpa" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink dark:text-white">
                  Ethiopian Higher Education GPA & Honors Forecaster
                </h3>
                <p className="text-xs sm:text-sm text-muted dark:text-dark-muted">
                  Interactive prediction based on the Ministry of Education (MoE) 4.0 grading scale.
                </p>
              </div>
              <Link
                to="/gpa-calculator"
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                Open Full Calculator <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] items-center">
              {/* Sliders */}
              <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 dark:border-dark-border dark:bg-dark-border/40">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-ink dark:text-white">Current Semester Target GPA</span>
                    <span className="text-highland font-mono font-bold text-sm">{gradeScore.toFixed(2)} / 4.00</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="4.0"
                    step="0.01"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(parseFloat(e.target.value))}
                    className="w-full accent-highland cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                    <span>2.00 (Pass)</span>
                    <span>3.00 (Good)</span>
                    <span>3.50 (Great)</span>
                    <span>4.00 (Perfect)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-ink dark:text-white">Semester Credit Hours</span>
                    <span className="text-highland font-mono font-bold text-sm">{creditHours} ECTS / Cr</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    value={creditHours}
                    onChange={(e) => setCreditHours(parseInt(e.target.value))}
                    className="w-full accent-highland cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                    <span>12 Minimum</span>
                    <span>18 Standard</span>
                    <span>24 Heavy Load</span>
                  </div>
                </div>
              </div>

              {/* Honors Badge Display */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-mist/80 to-surface p-6 text-center shadow-sm dark:border-dark-border dark:from-dark-surface dark:to-dark-border/40">
                <p className="text-xs uppercase font-mono tracking-wider text-muted dark:text-dark-muted">
                  Projected Academic Standing
                </p>
                <div className="mt-3 font-display text-4xl sm:text-5xl font-bold text-ink dark:text-white font-mono">
                  {gradeScore.toFixed(2)}
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold ${distinction.color}`}>
                  {distinction.label}
                </div>
                <p className="text-[11px] text-muted dark:text-dark-muted mt-3">
                  Qualified for MoE Dean's List and International Postgraduate Scholarships.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL CAMPUS PORTALS */}
        {activeTab === "portals" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink dark:text-white">
                  Official Campus Student Portals & Registrars
                </h3>
                <p className="text-xs sm:text-sm text-muted dark:text-dark-muted">
                  Direct one-click access to SIMS, course registration, grades, and digital libraries.
                </p>
              </div>
              <Link
                to="/universities"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-highland hover:underline"
              >
                Browse All 50+ Campuses <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPUS_PORTALS.map((campus) => (
                <a
                  key={campus.code}
                  href={campus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition-all hover:border-highland/50 hover:shadow-md dark:border-dark-border dark:bg-dark-border/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highland/10 text-highland font-bold text-xs group-hover:bg-highland group-hover:text-white transition-colors">
                      {campus.code}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-ink dark:text-white group-hover:text-highland transition-colors">
                        {campus.name}
                      </h4>
                      <p className="text-[11px] text-muted dark:text-dark-muted">
                        {campus.type} • {campus.students}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted group-hover:text-highland transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="border-t border-line/80 bg-mist/40 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-muted dark:border-dark-border dark:bg-dark-border/20">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          50+ Ethiopian Public & Private Universities Integrated
        </span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
          <Link to="/universities" className="hover:text-highland transition-colors">Universities</Link>
          <span>•</span>
          <Link to="/browse" className="hover:text-highland transition-colors">Past Exams</Link>
          <span>•</span>
          <Link to="/ai-assistant" className="hover:text-highland transition-colors">Gemini AI</Link>
          <span>•</span>
          <Link to="/scholarships" className="hover:text-highland transition-colors">Scholarships</Link>
        </div>
      </div>
    </div>
  );
}
