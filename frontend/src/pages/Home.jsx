import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  Zap,
  Sparkles,
  Globe,
  Bot,
  Star,
  Award,
  Calendar,
  MapPin,
  HelpCircle,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Compass,
  Check,
} from "lucide-react";
import api from "../api/client.js";
import AcademicUniverse3D from "../components/3d/AcademicUniverse3D.jsx";
import CampusMarquee from "../components/home/CampusMarquee.jsx";
import StudentOSDemo from "../components/home/StudentOSDemo.jsx";

const PLATFORM_STATS = [
  { value: "50+", label: "Verified Universities", desc: "Public & private campuses" },
  { value: "15,000+", label: "Curated Past Exams", desc: "With verified solution keys" },
  { value: "85,000+", label: "Active Students", desc: "Across all 12 regions" },
  { value: "99.4%", label: "Curriculum Accuracy", desc: "Organized by MoE syllabus" },
];

const BENTO_FEATURES = [
  {
    tag: "EXAM VAULT",
    title: "15,000+ Past Midterms & Finals with Solutions",
    description:
      "Stop searching random Telegram channels. Discover previous exams organized by university, department, course code, and semester with peer-verified answer keys.",
    icon: FileText,
    link: "/browse?type=PREVIOUS_EXAM",
    cta: "Explore Exam Vault",
    highlight: "text-emerald-500",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    colSpan: "lg:col-span-2",
  },
  {
    tag: "CAMPUS PORTALS",
    title: "One-Click Official University Portals",
    description:
      "Direct verified links to SIMS, Registrars, E-student portals, and digital libraries across 50+ Ethiopian universities.",
    icon: Building2,
    link: "/universities",
    cta: "Campus Directory",
    highlight: "text-blue-500",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    colSpan: "lg:col-span-1",
  },
  {
    tag: "DEGREE ROADMAP",
    title: "Semester-by-Semester Curriculum Tracker",
    description:
      "Track your 4 or 5-year Ethiopian engineering, medicine, or science degree progress with course dependencies and graduation milestones.",
    icon: Compass,
    link: "/academic-roadmap",
    cta: "Track Roadmap",
    highlight: "text-purple-500",
    bgGradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    colSpan: "lg:col-span-1",
  },
  {
    tag: "AI TUTOR • GEMINI 3.8 FLASH",
    title: "EthioStudent AI Study Copilot",
    description:
      "Trained on Ethiopian university exam patterns. Solves complex past exam questions, writes step-by-step mathematical proofs, and explains concepts in English and Amharic.",
    icon: Bot,
    link: "/ai-assistant",
    cta: "Start AI Session",
    highlight: "text-amber-500",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    colSpan: "lg:col-span-2",
  },
  {
    tag: "HONORS & GPA",
    title: "MoE 4.0 GPA & Honors Forecaster",
    description:
      "Calculate your semester GPA with Ethiopian credit hours (ECTS) and predict your Dean's List or Great Distinction honors standing.",
    icon: Award,
    link: "/gpa-calculator",
    cta: "Forecast GPA",
    highlight: "text-emerald-500",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    colSpan: "lg:col-span-1",
  },
  {
    tag: "OPPORTUNITIES",
    title: "MoE, DAAD & Global Scholarships",
    description:
      "Access curated undergraduate and postgraduate scholarships, Mastercard Foundation grants, and Ethiopian tech internships.",
    icon: Sparkles,
    link: "/scholarships",
    cta: "Find Scholarships",
    highlight: "text-sky-500",
    bgGradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    colSpan: "lg:col-span-1",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Finding past exams for Advanced Programming used to mean hunting through ten different Telegram groups. EthioStudentHub organized everything for our department in one place with actual solution manuals.",
    name: "Dagmawi Tesfaye",
    role: "Software Engineering, 4th Year",
    campus: "Addis Ababa Science & Tech (AASTU)",
    avatar: "DT",
    color: "bg-emerald-600",
  },
  {
    quote:
      "The Gemini 3.8 AI Assistant broke down cardiovascular pathology past exam questions step-by-step right before our block exam. It felt like having a senior consultant tutor beside me.",
    name: "Selamawit Bekele",
    role: "School of Medicine, Year 4",
    campus: "Jimma University (JU)",
    avatar: "SB",
    color: "bg-blue-600",
  },
  {
    quote:
      "The Ethiopian GPA calculator with official ECTS credit weights and the academic roadmap showed me exactly which courses I needed for Great Distinction. Highly recommend it to every freshman!",
    name: "Yared Mengistu",
    role: "Civil & Environmental Engineering",
    campus: "Addis Ababa University (AAiT)",
    avatar: "YM",
    color: "bg-amber-600",
  },
];

const FAQS = [
  {
    q: "Is EthioStudentHub completely free for Ethiopian students?",
    a: "Yes! 100% of public library materials, past exams, university directory portals, and student tools are free for all Ethiopian university students.",
  },
  {
    q: "How are past exams and course materials verified?",
    a: "Every resource uploaded to the hub undergoes a peer verification and moderation queue. Student moderators and senior peers verify course codes, academic year, and content quality before files enter the public library.",
  },
  {
    q: "Which Ethiopian universities are supported?",
    a: "All 50+ public universities (including AAU, ASTU, AASTU, Jimma, Hawassa, Bahir Dar, Gondar, Haramaya, Arba Minch, Mekelle, Wollo) as well as accredited private institutions are fully cataloged with campus portals.",
  },
  {
    q: "How does the EthioStudent AI Assistant (Gemini 3.8 Flash) work?",
    a: "The assistant uses Google's latest Gemini 3.8 Flash model, customized with prompt architectures tuned to Ethiopian higher education coursework, course codes, and bilingual technical support.",
  },
  {
    q: "Can I upload materials from my campus to help other students?",
    a: "Yes! Use the 'Upload' button to share past midterms, finals, syllabus sheets, and lecture slides. You earn community credits and contribute to your department's academic vault.",
  },
];

const FALLBACK_RESOURCES = [
  {
    id: "mock-1",
    title: "Data Structures & Algorithm Design (CoSc2012) Past Final Exam with Solutions",
    type: "PREVIOUS_EXAM",
    downloadCount: 3410,
    university: { name: "Addis Ababa University" },
    _count: { likes: 142, comments: 28 },
  },
  {
    id: "mock-2",
    title: "Applied Engineering Mechanics I: Statics (Ingeg2041) Comprehensive Review",
    type: "LECTURE_NOTE",
    downloadCount: 2890,
    university: { name: "Adama Science & Technology" },
    _count: { likes: 98, comments: 14 },
  },
  {
    id: "mock-3",
    title: "Pathology Block II: Cardiovascular & Respiratory Systems Review Packet",
    type: "PREVIOUS_EXAM",
    downloadCount: 4120,
    university: { name: "Jimma University" },
    _count: { likes: 210, comments: 46 },
  },
  {
    id: "mock-4",
    title: "Intermediate Microeconomics (Econ2011) Midterm Exam & Model Answers",
    type: "PREVIOUS_EXAM",
    downloadCount: 1750,
    university: { name: "Hawassa University" },
    _count: { likes: 65, comments: 11 },
  },
  {
    id: "mock-5",
    title: "Fluid Mechanics & Hydraulics (Ceng2082) Lab Manual & Equations Sheet",
    type: "LAB_MANUAL",
    downloadCount: 2210,
    university: { name: "Bahir Dar University" },
    _count: { likes: 88, comments: 19 },
  },
  {
    id: "mock-6",
    title: "Freshman General Chemistry (Chem1011) Practice Exams & Solutions",
    type: "PREVIOUS_EXAM",
    downloadCount: 5200,
    university: { name: "University of Gondar" },
    _count: { likes: 312, comments: 54 },
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const navigate = useNavigate();

  const universitiesQuery = useQuery({
    queryKey: ["home-universities"],
    queryFn: () => api.get("/universities?pageSize=1").then((r) => r.data),
    retry: false,
  });

  const resourcesQuery = useQuery({
    queryKey: ["home-resources"],
    queryFn: () => api.get("/resources?pageSize=6&sort=popular").then((r) => r.data),
    retry: false,
  });

  const displayResources =
    resourcesQuery.data?.items && resourcesQuery.data.items.length > 0
      ? resourcesQuery.data.items
      : FALLBACK_RESOURCES;

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-dark-bg dark:text-dark-text overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (3D PLANET ON LEFT, CLEAN SPACIOUS CONTENT ON RIGHT) */}
      {/* ========================================================================= */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-highland/10 blur-[130px] dark:bg-highland/20" />
        <div className="pointer-events-none absolute top-1/4 -right-32 h-[550px] w-[550px] rounded-full bg-gold/10 blur-[140px] dark:bg-gold/15" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/10" />

        <div className="page-shell relative">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            {/* Left Column: 3D Animated Planet (University Constellation) */}
            <div className="relative flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-[500px] rounded-3xl border border-line/80 bg-surface/40 p-2 shadow-2xl backdrop-blur-xl dark:border-dark-border/80 dark:bg-dark-surface/40">
                {/* 3D Campus Universe */}
                <AcademicUniverse3D
                  onSelectCampus={(campus) => {
                    navigate(`/universities?q=${encodeURIComponent(campus.name)}`);
                  }}
                />

                {/* Floating Micro-Cards around 3D core */}
                <div className="absolute -bottom-3 -left-3 hidden sm:flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 shadow-xl dark:border-dark-border dark:bg-dark-surface animate-float">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-highland/10 text-highland dark:bg-highland/20">
                    <GraduationCap size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-ink dark:text-white">15,000+ Exam Papers</p>
                    <p className="text-[10px] text-muted dark:text-dark-muted">AAU, ASTU, Jimma & more</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean, Spacious, User-Friendly Hero Content */}
            <div className="space-y-8 text-left order-1 lg:order-2">
              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-bold tracking-tight text-ink dark:text-white leading-[1.18]">
                  <span className="block sm:whitespace-nowrap">All Ethiopian Universities.</span>
                  <span className="block bg-gradient-to-r from-highland via-emerald-600 to-gold bg-clip-text text-transparent">
                    One Academic Hub.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted dark:text-dark-muted font-normal leading-relaxed max-w-lg">
                  Access verified past exams, lecture notes, official campus portals, and AI study help across 50+ Ethiopian universities.
                </p>
              </div>

              {/* Action Buttons in Professional Alignment */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/universities"
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-lg shadow-highland/20 hover:scale-[1.02] transition-transform"
                >
                  <Building2 size={18} />
                  <span>Explore 50+ Campuses</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/browse?type=PREVIOUS_EXAM"
                  className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold"
                >
                  <FileText size={18} />
                  <span>Past Exam Vault</span>
                </Link>

                <Link
                  to="/ai-assistant"
                  className="inline-flex items-center gap-2 rounded-xl border border-highland/30 bg-highland/10 px-5 py-3.5 text-sm font-semibold text-highland transition-all hover:bg-highland/20 dark:border-highland/40 dark:bg-highland/20 dark:text-emerald-300"
                >
                  <Bot size={18} />
                  <span>Gemini 3.8 AI Tutor</span>
                </Link>
              </div>

              {/* Stats & Trust Indicators in Professional Alignment */}
              <div className="pt-6 border-t border-line/70 dark:border-dark-border/70 max-w-lg space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-ink dark:text-white leading-none">
                      50+
                    </p>
                    <p className="text-xs font-semibold text-highland dark:text-emerald-400 mt-1.5">
                      Campuses
                    </p>
                    <p className="text-[11px] text-muted dark:text-dark-muted hidden sm:block mt-0.5">
                      Public & Private
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-ink dark:text-white leading-none">
                      15,000+
                    </p>
                    <p className="text-xs font-semibold text-highland dark:text-emerald-400 mt-1.5">
                      Past Exams
                    </p>
                    <p className="text-[11px] text-muted dark:text-dark-muted hidden sm:block mt-0.5">
                      Verified Solutions
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-ink dark:text-white leading-none">
                      85,000+
                    </p>
                    <p className="text-xs font-semibold text-highland dark:text-emerald-400 mt-1.5">
                      Students
                    </p>
                    <p className="text-[11px] text-muted dark:text-dark-muted hidden sm:block mt-0.5">
                      Nationwide Hub
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted dark:text-dark-muted pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-highland" /> 100% Free for Students
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-highland" /> Peer-Verified Materials
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-highland" /> Official Campus Portals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CAMPUS MARQUEE (INFINITE UNIVERSITY RIBBON) */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="page-shell mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
            <Building2 size={14} className="text-highland" />
            <span>Integrated Ethiopian Higher Education Campuses</span>
          </div>
          <Link to="/universities" className="text-xs font-bold text-highland hover:underline flex items-center gap-1">
            All 50+ Campuses <ArrowRight size={12} />
          </Link>
        </div>
        <CampusMarquee />
      </section>

      {/* ========================================================================= */}
      {/* 3. LIVE INTERACTIVE STUDENT OS SIMULATOR */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 relative">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center mb-10 space-y-2.5">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl dark:text-white">
              The Student Operating System in Action
            </h2>
            <p className="text-sm sm:text-base text-muted dark:text-dark-muted">
              Test drive the Exam Vault, Gemini 3.8 Flash AI Tutor, MoE 4.0 GPA Forecaster, and Campus Portals right here.
            </p>
          </div>

          <StudentOSDemo />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BENTO GRID: COMPREHENSIVE PLATFORM ARCHITECTURE */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-line/70 bg-mist/30 dark:border-dark-border/70 dark:bg-dark-surface/30">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted">
              <Layers size={14} className="text-highland" /> Complete Academic Ecosystem
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl dark:text-white">
              Engineered for Ethiopian Academic Success
            </h2>
            <p className="text-sm sm:text-base text-muted dark:text-dark-muted">
              Everything an Ethiopian university student needs from Freshman year to graduation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BENTO_FEATURES.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-line/80 bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-highland/50 hover:shadow-xl dark:border-dark-border dark:bg-dark-surface ${card.colSpan}`}
                >
                  {/* Subtle top corner gradient glow */}
                  <div className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br ${card.bgGradient} blur-2xl group-hover:scale-150 transition-transform duration-500`} />

                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-highland dark:text-emerald-400">
                        {card.tag}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-ink transition-transform duration-300 group-hover:scale-110 dark:bg-dark-border dark:text-white">
                        <Icon size={24} className={card.highlight} />
                      </div>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-ink dark:text-white group-hover:text-highland transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted dark:text-dark-muted">
                      {card.description}
                    </p>
                  </div>

                  <div className="relative pt-6 mt-6 border-t border-line/60 dark:border-dark-border/60">
                    <Link
                      to={card.link}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-highland group-hover:underline dark:text-emerald-400"
                    >
                      <span>{card.cta}</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. POPULAR & CURATED EXAM VAULT STREAM */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 relative">
        <div className="page-shell">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-highland mb-2">
                <TrendingUp size={16} /> Verified Course Library
              </div>
              <h2 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
                Trending Past Exams & Lecture Modules
              </h2>
              <p className="text-sm text-muted dark:text-dark-muted mt-1">
                Highest-rated study materials approved in the national repository this semester.
              </p>
            </div>
            <Link
              to="/browse"
              className="btn-secondary inline-flex items-center gap-2 rounded-xl text-xs font-semibold py-2.5 px-4 self-start sm:self-auto"
            >
              Browse Complete Library <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayResources.map((item) => (
              <Link
                key={item.id}
                to={`/resources/${item.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-highland/50 hover:shadow-lg dark:border-dark-border dark:bg-dark-surface"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="badge-green text-[10px] font-bold">
                      {item.type?.replaceAll("_", " ") || "STUDY MATERIAL"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted font-medium">
                      <Download size={12} /> {item.downloadCount ?? 0} downloads
                    </span>
                  </div>

                  <h3 className="line-clamp-2 font-display text-base font-semibold text-ink group-hover:text-highland transition-colors dark:text-white">
                    {item.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted dark:text-dark-muted">
                    <Building2 size={14} className="text-highland shrink-0" />
                    <span className="truncate">{item.university?.name || "National Higher Education Library"}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted dark:border-dark-border/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      {item._count?.likes ?? 12}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {item._count?.comments ?? 4}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-highland group-hover:underline">
                    Preview <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. STUDENT VOICES & CAMPUS TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-line/70 bg-mist/40 dark:border-dark-border/70 dark:bg-dark-surface/40">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted dark:border-dark-border dark:bg-dark-surface">
              <Star size={14} className="text-gold fill-gold" /> Student Testimonials
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">
              Loved by Students Across Ethiopia
            </h2>
            <p className="text-sm sm:text-base text-muted dark:text-dark-muted">
              Here is how EthioStudentHub is helping students excel in midterms, finals, and degree roadmaps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 shadow-sm dark:border-dark-border dark:bg-dark-surface"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-ink/90 dark:text-dark-text/90 italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-line/60 dark:border-dark-border/60 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-ink dark:text-white">{t.name}</h4>
                    <p className="text-[11px] text-muted dark:text-dark-muted">{t.role}</p>
                    <p className="text-[10px] text-highland dark:text-emerald-400 font-medium">{t.campus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 relative">
        <div className="page-shell max-w-4xl">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted dark:border-dark-border dark:bg-dark-surface">
              <HelpCircle size={14} className="text-highland" /> Questions & Answers
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted dark:text-dark-muted">
              Everything you need to know about accessing materials, contributing, and using AI.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-line bg-surface overflow-hidden transition-all dark:border-dark-border dark:bg-dark-surface"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-ink dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-highland" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-muted dark:text-dark-muted border-t border-line/40 pt-3 dark:border-dark-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. GRAND FINALE CALL TO ACTION (CTA) */}
      {/* ========================================================================= */}
      <section className="pb-20 relative">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-highland-dark via-highland to-emerald-800 p-8 sm:p-14 lg:p-16 text-center text-white shadow-2xl">
            {/* Background glowing rings */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative mx-auto max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                <Sparkles size={14} className="text-gold" />
                Empowering Ethiopia's Future Leaders
              </div>

              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl leading-tight">
                Your Entire University Journey, Supercharged.
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-emerald-100/90 font-normal">
                Join thousands of Ethiopian students preparing for midterms, finding verified past exams, tracking graduation roadmaps, and studying with Gemini 3.8 Flash.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  to="/register"
                  className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-highland-dark shadow-xl hover:bg-emerald-50 transition-colors"
                >
                  Create Free Student Account
                </Link>
                <Link
                  to="/universities"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  Explore 50+ Campuses
                </Link>
                <Link
                  to="/ai-assistant"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  Try Gemini 3.8 AI
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-emerald-200/80">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-gold" /> Free Forever for Students
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-gold" /> 50+ Ethiopian Campuses
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-gold" /> Zero Spam • Peer Moderated
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
