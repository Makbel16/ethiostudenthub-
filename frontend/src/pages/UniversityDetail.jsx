import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Globe2,
  Library,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  School,
  UsersRound,
  Sparkles,
  Star,
  Award,
  TrendingUp,
  ArrowRight,
  Clock,
  FileText,
  Link as LinkIcon,
  Info,
  ChevronRight,
  Menu,
  X,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Share2,
  Bookmark,
  Eye,
  Download,
  Layers,
  Target,
  Compass,
  Zap,
  Crown,
  Shield,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Facebook,
} from "lucide-react";
import api from "../api/client.js";

const labelFromEnum = (value) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const formatPhoneHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer",
};

const CALENDAR_LABELS = {
  SEMESTER_START: "Semester Start",
  SEMESTER_END: "Semester End",
  REGISTRATION_DEADLINE: "Registration Deadline",
  EXAM_PERIOD: "Exam Period",
  HOLIDAY: "Holiday",
  GRADUATION: "Graduation Date",
};

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const formatCalendarDate = (event) => {
  if (!event.endDate || event.endDate === event.startDate) return formatDate(event.startDate);
  return `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;
};

const SEMESTERS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Summer" },
];

const UNASSIGNED_COLLEGE_ID = "__unassigned__";

const ordinal = (value) => {
  const number = Number(value);
  if (!number) return "Year not set";
  const mod10 = number % 10;
  const mod100 = number % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? "st" : mod10 === 2 && mod100 !== 12 ? "nd" : mod10 === 3 && mod100 !== 13 ? "rd" : "th";
  return `${number}${suffix} Year`;
};

const semesterLabel = (value) => SEMESTERS.find((semester) => semester.value === String(value))?.label || "Semester not set";

const yearOptions = (department) => {
  if (department?.durationYears) {
    return Array.from({ length: department.durationYears }, (_, index) => String(index + 1));
  }

  const years = Array.from(new Set((department?.courses ?? []).map((course) => course.year).filter(Boolean))).sort((a, b) => a - b);
  return years.map(String);
};

export default function UniversityDetail() {
  const { idOrSlug } = useParams();
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const university = useQuery({
    queryKey: ["university-detail", idOrSlug],
    queryFn: () => api.get(`/universities/${idOrSlug}`).then((r) => r.data),
  });

  const item = university.data || {};
  const colleges = useMemo(() => item.colleges ?? [], [item.colleges]);
  const departments = useMemo(() => item.departments ?? [], [item.departments]);
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
  const years = useMemo(() => yearOptions(selectedDepartment), [selectedDepartment]);
  const semesters = useMemo(() => {
    if (!selectedDepartment) return [];
    const values = Array.from(
      new Set(
        (selectedDepartment.courses ?? [])
          .filter((course) => !selectedYear || String(course.year) === selectedYear)
          .map((course) => course.semester)
          .filter(Boolean)
      )
    ).sort((a, b) => a - b);
    return values.length ? values.map(String) : SEMESTERS.map((semester) => semester.value);
  }, [selectedDepartment, selectedYear]);
  const filteredCourses = useMemo(
    () =>
      (selectedDepartment?.courses ?? []).filter(
        (course) =>
          (!selectedYear || String(course.year) === selectedYear) &&
          (!selectedSemester || String(course.semester) === selectedSemester)
      ),
    [selectedDepartment, selectedYear, selectedSemester]
  );

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
    if (!years.length) {
      setSelectedYear("");
      return;
    }
    if (!selectedYear || !years.includes(selectedYear)) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  useEffect(() => {
    if (!semesters.length) {
      setSelectedSemester("");
      return;
    }
    if (!selectedSemester || !semesters.includes(selectedSemester)) setSelectedSemester(semesters[0]);
  }, [semesters, selectedSemester]);

  if (university.isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-highland border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-600 dark:text-dark-muted font-medium">Loading...</p>
      </div>
    </div>
  );
  
  if (university.isError || !university.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-surface">
        <div className="text-center p-12 bg-white dark:bg-dark-surface rounded-3xl shadow-2xl max-w-md">
          <Building2 size={80} className="text-slate-300 dark:text-dark-muted mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-dark-text">University Not Found</h2>
          <p className="text-slate-500 dark:text-dark-muted mt-3">The institution you're looking for doesn't exist or is inactive.</p>
          <Link to="/universities" className="mt-8 inline-flex items-center gap-2 bg-highland text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-highland-dark transition shadow-lg hover:shadow-xl">
            <ArrowRight size={20} className="rotate-180" />
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const primaryLibraryUrl = item.libraryUrl || item.digitalLibraryUrl || item.libraryCatalogUrl || item.institutionalRepositoryUrl;
  const locationLine = [item.region, item.city].filter(Boolean).join(" - ");
  const mapUrl = item.latitude && item.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link to="/universities" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border border-slate-200/50 dark:border-dark-border/50 text-sm font-medium text-slate-700 dark:text-dark-text hover:text-highland hover:border-highland/50 transition-all shadow-sm">
            <ArrowRight size={16} className="rotate-180" />
            Back to Universities
          </Link>
        </div>

        {/* Hero Section - Premium Design with Green */}
        <section className="relative mb-12">
          <div className="relative bg-gradient-to-br from-highland via-highland-dark to-emerald-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-dark-border rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400 dark:bg-amber-600 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-300 dark:bg-emerald-700 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative p-8 md:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Logo */}
                <div className="relative group">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/10 dark:bg-dark-border/20 backdrop-blur-xl border-2 border-white/30 dark:border-dark-border/30 overflow-hidden shadow-2xl flex items-center justify-center">
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={56} className="text-white/80" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-bg flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                </div>

                <div className="flex-1 text-white">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.verificationStatus === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-emerald-100 border border-emerald-500/30">
                        <Shield size={14} />
                        Verified
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-white/20 dark:bg-dark-border/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white">
                      <Sparkles size={14} />
                      {labelFromEnum(item.ownership)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/20 dark:bg-dark-border/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white">
                      <Award size={14} />
                      {labelFromEnum(item.institutionType)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-amber-100 border border-amber-500/30">
                      <Star size={14} />
                      Top Institution
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                    {item.name}
                  </h1>
                  {item.shortName && (
                    <p className="text-highland-light text-xl mt-1 font-medium">{item.shortName}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-6 mt-4 text-highland-light">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} />
                      <span className="text-sm font-medium">{locationLine || "Location not set"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersRound size={18} />
                      <span className="text-sm font-medium">{departments.length} Departments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} />
                      <span className="text-sm font-medium">{item.relatedResources?.length || 0} Resources</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full lg:w-auto">
                  <Link 
                    to={`/browse?universityId=${item.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-white dark:bg-dark-surface text-highland dark:text-highland-light px-8 py-4 rounded-2xl font-bold hover:bg-highland-light/10 dark:hover:bg-dark-border transition shadow-xl hover:shadow-2xl hover:scale-105 duration-300"
                  >
                    <BookOpen size={20} />
                    Explore Resources
                    <ChevronRight size={18} />
                  </Link>
                  <div className="flex gap-2">
                    <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-white/20 dark:bg-dark-border/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-medium border border-white/30 dark:border-dark-border/30 hover:bg-white/30 dark:hover:bg-dark-border/40 transition">
                      <Heart size={18} />
                      Save
                    </button>
                    <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-white/20 dark:bg-dark-border/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-medium border border-white/30 dark:border-dark-border/30 hover:bg-white/30 dark:hover:bg-dark-border/40 transition">
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Overview - Premium with Green */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-dark-border/50 hover:shadow-xl hover:border-highland/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl group-hover:scale-110 transition-transform duration-300 dark:from-slate-700 dark:to-slate-600">
                <GraduationCap size={18} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-dark-text">{colleges.length}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Colleges</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-dark-border/50 hover:shadow-xl hover:border-highland/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl group-hover:scale-110 transition-transform duration-300 dark:from-slate-700 dark:to-slate-600">
                <UsersRound size={18} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-dark-text">{departments.length}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Departments</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-dark-border/50 hover:shadow-xl hover:border-highland/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl group-hover:scale-110 transition-transform duration-300 dark:from-slate-700 dark:to-slate-600">
                <BookOpen size={18} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-dark-text">{item.relatedResources?.length || 0}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Resources</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-dark-border/50 hover:shadow-xl hover:border-highland/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl group-hover:scale-110 transition-transform duration-300 dark:from-slate-700 dark:to-slate-600">
                <CalendarDays size={18} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-dark-text">{item.calendarEvents?.length || 0}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Events</p>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-6 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                <Info size={24} />
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">About This Institution</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-dark-muted">Learn about the university's mission, vision, and unique qualities</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 shadow-inner border border-slate-100 dark:from-dark-surface dark:to-dark-bg dark:border-dark-border">
              <div className="flex items-start gap-3">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                  <GraduationCap size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-base leading-relaxed text-slate-700 dark:text-dark-text font-light">
                    {item.description || "No description has been added for this institution yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMS AND COURSES - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-6 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                <GraduationCap size={24} />
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">Programs & Courses</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-dark-muted">Explore the academic offerings and degree programs</p>
              </div>
            </div>

            {collegeOptions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                <BookOpen size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                <p className="text-slate-500 dark:text-dark-muted">No program catalog has been published yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Selectors - Premium Design */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-600 dark:text-slate-400" />
                      College
                    </label>
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-highland focus:ring-2 focus:ring-highland/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                    >
                      {collegeOptions.map((college) => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-slate-600 dark:text-slate-400" />
                      Department
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-highland focus:ring-2 focus:ring-highland/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                      disabled={departmentsForCollege.length === 0}
                    >
                      {departmentsForCollege.length === 0 ? (
                        <option value="">No programs in this college</option>
                      ) : (
                        departmentsForCollege.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-600 dark:text-slate-400" />
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-highland focus:ring-2 focus:ring-highland/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                      disabled={!selectedDepartment || years.length === 0}
                    >
                      {years.length === 0 ? (
                        <option value="">No years</option>
                      ) : (
                        years.map((year) => (
                          <option key={year} value={year}>{ordinal(year)}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-600 dark:text-slate-400" />
                      Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-highland focus:ring-2 focus:ring-highland/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                      disabled={!selectedDepartment || semesters.length === 0}
                    >
                      {semesters.length === 0 ? (
                        <option value="">No semesters</option>
                      ) : (
                        semesters.map((semester) => (
                          <option key={semester} value={semester}>{semesterLabel(semester)}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {!selectedDepartment ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                    <Layers size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-dark-muted font-medium">Select a department to view courses</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Department Info - Premium */}
                    <div className="bg-gradient-to-r from-slate-100 via-slate-50 dark:via-slate-800 to-slate-100 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-dark-text">{selectedDepartment.name}</h3>
                          {selectedDepartment.degreeAwarded && (
                            <p className="text-slate-600 font-semibold mt-1 flex items-center gap-2 dark:text-slate-400">
                              <Award size={18} />
                              {selectedDepartment.degreeAwarded}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-6 mt-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-muted">
                              <CalendarDays size={16} className="text-slate-600 dark:text-slate-400" />
                              <span className="font-medium">{selectedDepartment.durationYears ? `${selectedDepartment.durationYears} years` : "Duration not set"}</span>
                            </div>
                            {selectedDepartment.batches?.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-muted">
                                <UsersRound size={16} className="text-slate-600 dark:text-slate-400" />
                                <span className="font-medium">{selectedDepartment.batches.reduce((sum, b) => sum + (b.capacity || 0), 0)} seats</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedDepartment.batches?.map((batch) => (
                            <span key={batch.id} className="px-4 py-2 bg-white dark:bg-dark-surface rounded-xl text-xs font-bold text-slate-700 dark:text-dark-text border border-slate-200 dark:border-dark-border shadow-sm">
                              {batch.admissionYear}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Courses */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <BookOpen size={18} className="text-slate-600 dark:text-slate-400" />
                          <span className="font-bold text-slate-700 dark:text-dark-text">
                            {selectedYear ? ordinal(selectedYear) : "All Years"} • {selectedSemester ? semesterLabel(selectedSemester) : "All Semesters"}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-dark-muted font-medium">({filteredCourses.length} courses)</span>
                        </div>
                      </div>

                      {filteredCourses.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                          <BookOpen size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-dark-muted font-medium">No courses available for this selection</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredCourses.map((course) => (
                            <div key={course.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:border-highland/50 dark:border-dark-border dark:bg-dark-surface">
                              <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative">
                                <div className="flex items-start justify-between">
                                  <p className="font-bold text-slate-800 dark:text-dark-text group-hover:text-highland transition">{course.title}</p>
                                  <ChevronRight size={16} className="text-slate-300 dark:text-dark-muted group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
                                </div>
                                {course.code && (
                                  <p className="mt-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">{course.code}</p>
                                )}
                                {course.credits && (
                                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full dark:text-slate-300 dark:bg-slate-700">
                                    <Award size={12} />
                                    {course.credits} credits
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ACADEMIC CALENDAR - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-8 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-xl dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                <CalendarDays size={28} />
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">Academic Calendar</h2>
                <p className="text-slate-500 dark:text-dark-muted">Important dates and events</p>
              </div>
            </div>

            {item.calendarEvents?.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                <CalendarDays size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                <p className="text-slate-500 dark:text-dark-muted font-medium">No academic calendar events published yet.</p>
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.calendarEvents?.map((event) => (
                  <div key={event.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-highland/50 border border-transparent dark:from-dark-surface dark:to-dark-bg">
                    <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600 tracking-wider dark:text-slate-400">
                        <Clock size={14} />
                        {CALENDAR_LABELS[event.type] || labelFromEnum(event.type)}
                      </dt>
                      <dd className="mt-3 text-lg font-bold text-slate-800 dark:text-dark-text">{formatCalendarDate(event)}</dd>
                      {event.title && <p className="mt-2 text-sm text-slate-600 dark:text-dark-muted">{event.title}</p>}
                    </div>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* ANNOUNCEMENTS - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-8 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-xl dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                <Megaphone size={28} />
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">Announcements</h2>
                <p className="text-slate-500 dark:text-dark-muted">Latest news and updates</p>
              </div>
            </div>

            {item.announcements?.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                <Megaphone size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                <p className="text-slate-500 dark:text-dark-muted font-medium">No announcements published yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {item.announcements?.map((announcement) => (
                  <article key={announcement.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-highland/50 border border-transparent dark:from-dark-surface dark:to-dark-bg">
                    <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                          <FileText size={20} />
                        </span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-dark-text group-hover:text-highland transition">{announcement.title}</h3>
                          {announcement.body && <p className="mt-2 text-sm text-slate-600 dark:text-dark-muted">{announcement.body}</p>}
                          <p className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-2">
                            <Clock size={12} />
                            {formatDate(announcement.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RELATED RESOURCES - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-8 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">Related Resources</h2>
                <p className="text-slate-500 dark:text-dark-muted">Educational materials and documents</p>
              </div>
              <Link to={`/browse?universityId=${item.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-highland to-highland-dark px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 duration-300">
                View all
                <ArrowRight size={18} />
              </Link>
            </div>

            {item.relatedResources?.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                <BookOpen size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                <p className="text-slate-500 dark:text-dark-muted font-medium">No resources available.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {item.relatedResources?.map((resource) => (
                  <Link key={resource.id} to={`/resources/${resource.id}`} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-highland/50 border border-slate-200 dark:from-dark-surface dark:to-dark-bg dark:border-dark-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-300 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300 dark:border-slate-500">
                        <BookOpen size={12} />
                        {resource.type?.replaceAll("_", " ")}
                      </span>
                      <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-dark-text group-hover:text-highland transition">{resource.title}</h3>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-dark-muted">
                        {resource.description || "No description provided."}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {resource.department?.name && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            <Building2 size={12} />
                            {resource.department.name}
                          </span>
                        )}
                        {resource.courseCode && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <BookOpen size={12} />
                            {resource.courseCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* USEFUL LINKS - Premium with Green */}
        <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-8 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-dark-text">Useful Links</h2>
                <p className="text-slate-500 dark:text-dark-muted">Helpful external resources</p>
              </div>
              <Link to={`/browse?universityId=${item.id}&type=USEFUL_LINK`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-highland to-highland-dark px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 duration-300">
                View all
                <ArrowRight size={18} />
              </Link>
            </div>

            {item.relatedUsefulLinks?.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                <LinkIcon size={48} className="text-slate-300 dark:text-dark-muted mx-auto mb-3" />
                <p className="text-slate-500 dark:text-dark-muted font-medium">No useful links available.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {item.relatedUsefulLinks?.map((resource) => (
                  <div key={resource.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-highland/50 border border-slate-200 dark:from-dark-surface dark:to-dark-bg dark:border-dark-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-300 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300 dark:border-slate-500">
                        <LinkIcon size={12} />
                        Useful Link
                      </span>
                      <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-dark-text">{resource.title}</h3>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-dark-muted">
                        {resource.description || "No description provided."}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <a href={resource.fileUrl} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 dark:bg-dark-surface" {...externalLinkProps}>
                          <ExternalLink size={16} />
                          Open link
                        </a>
                        <Link to={`/resources/${resource.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md dark:border-dark-border dark:bg-dark-surface dark:text-dark-text">
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SIDEBAR CARDS - 3 columns with premium green design */}
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          {/* Quick Links */}
          <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-6 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-dark-text">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                  <LinkIcon size={18} />
                </span>
                Quick Links
              </h2>
              <div className="space-y-3">
                <QuickLinkPremium icon={Globe2} title="Official Website" label="Visit Website" url={item.website} />
                <QuickLinkPremium
                  icon={School}
                  title="Student Portal"
                  label="Open Portal"
                  url={item.studentPortalUrl}
                  missingText="Student portal not available"
                />
                <QuickLinkPremium icon={Library} title="University Library" label="Open Library" url={primaryLibraryUrl} />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-6 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-dark-text">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                  <Phone size={18} />
                </span>
                Contact
              </h2>
              <dl className="space-y-4 text-sm">
                <ContactRowPremium icon={Phone} label="Phone">
                  {item.contactPhone ? (
                    <a href={formatPhoneHref(item.contactPhone)} className="font-bold text-highland hover:underline">
                      {item.contactPhone}
                    </a>
                  ) : (
                    <span className="text-slate-500">Not available</span>
                  )}
                </ContactRowPremium>
                <ContactRowPremium icon={Mail} label="Email">
                  {item.contactEmail ? (
                    <a href={`mailto:${item.contactEmail}`} className="font-bold text-highland hover:underline">
                      {item.contactEmail}
                    </a>
                  ) : (
                    <span className="text-slate-500">Not available</span>
                  )}
                </ContactRowPremium>
                <ContactRowPremium icon={MapPin} label="Address">
                  <span className="text-slate-700 dark:text-dark-text">{item.address || "Not available"}</span>
                </ContactRowPremium>
                {item.additionalContactInfo && (
                  <ContactRowPremium icon={Building2} label="Additional">
                    <span className="text-slate-700 dark:text-dark-text">{item.additionalContactInfo}</span>
                  </ContactRowPremium>
                )}
              </dl>
            </div>
          </section>

          {/* Location */}
          <section className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl p-6 transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-dark-text">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-lg dark:from-slate-700 dark:to-slate-600 dark:text-slate-300">
                  <MapPin size={18} />
                </span>
                Location
              </h2>
              <dl className="space-y-3 text-sm">
                <InfoPairPremium label="Region" value={item.region || "Not set"} />
                <InfoPairPremium label="City" value={item.city || "Not set"} />
                <InfoPairPremium label="Address" value={item.address || "Not set"} />
              </dl>
              {mapUrl && (
                <a href={mapUrl} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-highland to-highland-dark px-4 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm" {...externalLinkProps}>
                  <MapPin size={16} />
                  Open Map
                </a>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// Premium QuickLink Component
function QuickLinkPremium({ icon: Icon, title, label, url, missingText }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm transition-all hover:shadow-md dark:from-dark-surface dark:to-dark-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-dark-text">
          <Icon size={16} className="text-slate-600 dark:text-slate-400" />
          {title}
        </p>
        {url ? (
          <a href={url} className="mt-2 inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-highland/50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text" {...externalLinkProps}>
            <span>{label}</span>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </a>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-dark-muted">{missingText || `${title} not available`}</p>
        )}
      </div>
    </div>
  );
}

// Premium StatCard
function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    highland: "from-highland to-highland-dark",
    teal: "from-teal-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    orange: "from-orange-500 to-amber-500",
  };
  
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-6 shadow-xl transition-all hover:shadow-2xl dark:bg-dark-surface/80 dark:border-dark-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative flex items-center gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color] || colorClasses.highland} text-white shadow-xl`}>
          <Icon size={28} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-dark-muted tracking-wide">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-dark-text">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Premium ContactRow
function ContactRowPremium({ icon: Icon, label, children }) {
  return (
    <div>
      <dt className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
        <Icon size={14} className="text-slate-600 dark:text-slate-400" />
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// Premium ProgramInfoTile
function ProgramInfoTile({ icon: Icon, label, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm transition-all hover:shadow-md dark:from-slate-700 dark:to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-highland/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative">
        <dt className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
          <Icon size={16} className="text-highland" />
          {label}
        </dt>
        <dd className="mt-2 text-base font-bold text-slate-800 dark:text-white">{value}</dd>
      </div>
    </div>
  );
}

// Premium InfoPair
function InfoPairPremium({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2.5 last:border-b-0 last:pb-0 dark:border-slate-600">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-semibold text-slate-800 dark:text-white">{value}</dd>
    </div>
  );
}