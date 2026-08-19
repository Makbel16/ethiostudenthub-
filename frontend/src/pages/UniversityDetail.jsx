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

  if (university.isLoading) return <p className="page-shell py-12 text-sm text-muted">Loading university...</p>;
  if (university.isError || !university.data) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">University not found or inactive.</div>
      </div>
    );
  }
  const primaryLibraryUrl =
    item.libraryUrl || item.digitalLibraryUrl || item.libraryCatalogUrl || item.institutionalRepositoryUrl;
  const libraryLinks = [
    { label: "Library website", url: item.libraryUrl },
    { label: "Digital library", url: item.digitalLibraryUrl },
    { label: "Library catalog", url: item.libraryCatalogUrl },
    { label: "Institutional repository", url: item.institutionalRepositoryUrl },
  ].filter((link) => link.url);
  const locationLine = [item.region, item.city].filter(Boolean).join(" - ");
  const mapUrl =
    item.latitude && item.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
      : null;

  return (
    <div className="page-shell py-10">
      <div className="mb-6">
        <Link to="/universities" className="text-sm font-semibold text-highland hover:underline">
          Back to University Directory
        </Link>
      </div>

      <section className="section-panel rounded-xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist text-highland">
              {item.logoUrl ? (
                <img src={item.logoUrl} alt={`${item.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <Building2 size={38} />
              )}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {item.verificationStatus === "VERIFIED" && (
                  <span className="badge-green">
                    <CheckCircle2 size={13} />
                    Verified
                  </span>
                )}
                <span className="badge">{labelFromEnum(item.ownership)}</span>
                <span className="badge">{labelFromEnum(item.institutionType)}</span>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{item.name}</h1>
              {item.shortName && <p className="mt-2 text-lg font-semibold text-muted">{item.shortName}</p>}
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <MapPin size={16} />
                {locationLine || "Location not set"}
                {item.address && <span>- {item.address}</span>}
              </p>
            </div>
          </div>

          <Link to={`/browse?universityId=${item.id}`} className="btn-primary self-start">
            <BookOpen size={16} />
            Browse resources
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Description</h2>
            <p className="mt-3 rounded-lg border border-line bg-paper p-5 text-sm leading-7 text-ink/80">
              {item.description || "No description has been added for this institution yet."}
            </p>
          </div>

          <aside className="section-panel rounded-xl p-5">
            <p className="font-semibold text-ink">Quick links</p>
            <div className="mt-4 space-y-3">
              <QuickLink icon={Globe2} title="Official Website" label="Visit Website" url={item.website} />
              <QuickLink
                icon={School}
                title="Student Portal"
                label="Open Student Portal"
                url={item.studentPortalUrl}
                missingText="Student portal not available"
              />
              <QuickLink icon={Library} title="University Library" label="Open Library" url={primaryLibraryUrl} />
            </div>
          </aside>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <GraduationCap size={20} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Programs and Courses</h2>
                <p className="mt-1 text-sm text-muted">Explore colleges, departments, admission batches, capacity, and course plans.</p>
              </div>
            </div>

            {collegeOptions.length === 0 ? (
              <div className="empty-state">No program catalog has been published yet.</div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
                <div className="space-y-4">
                  <div>
                    <label className="field-label">College</label>
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      className="select-field"
                    >
                      {collegeOptions.map((college) => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Department / Program</label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="select-field"
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="select-field"
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
                    <div>
                      <label className="field-label">Semester</label>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="select-field"
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
                </div>

                {!selectedDepartment ? (
                  <div className="empty-state">No department or program is available for the selected college.</div>
                ) : (
                  <div>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <ProgramInfoTile
                        icon={Building2}
                        label="College"
                        value={selectedCollege?.name || "Not assigned"}
                      />
                      <ProgramInfoTile
                        icon={CalendarDays}
                        label="Duration"
                        value={selectedDepartment.durationYears ? `${selectedDepartment.durationYears} years` : "Not set"}
                      />
                      <ProgramInfoTile
                        icon={UsersRound}
                        label="Seats"
                        value={
                          selectedDepartment.batches?.some((batch) => batch.capacity)
                            ? `${selectedDepartment.batches.reduce((sum, batch) => sum + (batch.capacity || 0), 0)} listed`
                            : "Not set"
                        }
                      />
                    </div>

                    <div className="rounded-lg border border-line bg-paper p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-ink">{selectedDepartment.name}</h3>
                          {selectedDepartment.degreeAwarded && (
                            <p className="mt-1 text-sm font-semibold text-highland">{selectedDepartment.degreeAwarded}</p>
                          )}
                        </div>
                        {selectedDepartment.batches?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedDepartment.batches.map((batch) => (
                              <span key={batch.id} className="badge">
                                Batch {batch.admissionYear}
                                {batch.capacity ? ` - ${batch.capacity} seats` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedDepartment.programOverview && (
                        <p className="mt-4 text-sm leading-6 text-ink/80">{selectedDepartment.programOverview}</p>
                      )}
                      {selectedDepartment.admissionRequirements && (
                        <div className="mt-4 rounded-lg border border-line bg-white p-4">
                          <p className="text-xs font-semibold uppercase text-muted">Admission Requirements</p>
                          <p className="mt-2 text-sm leading-6 text-ink/80">{selectedDepartment.admissionRequirements}</p>
                        </div>
                      )}

                      <div className="mt-5">
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                          <BookOpen size={16} className="text-highland" />
                          {selectedYear ? ordinal(selectedYear) : "Academic Year"} - {selectedSemester ? semesterLabel(selectedSemester) : "Semester"}
                        </p>
                        {filteredCourses.length === 0 ? (
                          <div className="empty-state py-6">No courses have been listed for this year and semester.</div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {filteredCourses.map((course) => (
                              <div key={course.id} className="rounded-lg border border-line bg-white p-3">
                                <p className="font-semibold text-ink">{course.title}</p>
                                {course.code && <p className="mt-1 text-xs font-semibold text-muted">{course.code}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <CalendarDays size={20} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Academic Calendar</h2>
                <p className="mt-1 text-sm text-muted">Official dates published by this university.</p>
              </div>
            </div>

            {item.calendarEvents?.length === 0 && (
              <div className="empty-state">No academic calendar information has been published yet.</div>
            )}

            <dl className="grid gap-3 sm:grid-cols-2">
              {item.calendarEvents?.map((event) => (
                <div key={event.id} className="rounded-lg border border-line bg-paper p-4">
                  <dt className="text-xs font-semibold uppercase text-muted">
                    {CALENDAR_LABELS[event.type] || labelFromEnum(event.type)}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-ink">{formatCalendarDate(event)}</dd>
                  {event.title && <p className="mt-2 text-sm leading-6 text-muted">{event.title}</p>}
                </div>
              ))}
            </dl>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-highland-light text-highland">
                <Megaphone size={20} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Important Announcements</h2>
                <p className="mt-1 text-sm text-muted">Official student-related notices from this university.</p>
              </div>
            </div>

            {item.announcements?.length === 0 && (
              <div className="empty-state">No announcements have been published yet.</div>
            )}

            <div className="space-y-3">
              {item.announcements?.map((announcement) => (
                <article key={announcement.id} className="rounded-lg border border-line bg-paper p-4">
                  <h3 className="font-semibold text-ink">{announcement.title}</h3>
                  {announcement.body && <p className="mt-2 text-sm leading-6 text-muted">{announcement.body}</p>}
                  <p className="mt-3 text-xs font-semibold text-muted">{formatDate(announcement.createdAt)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Related resources</h2>
                <p className="mt-1 text-sm text-muted">Materials already connected to this university.</p>
              </div>
              <Link to={`/browse?universityId=${item.id}`} className="btn-secondary self-start">
                View all
              </Link>
            </div>

            {item.relatedResources?.length === 0 && (
              <div className="empty-state">No approved resources are associated with this university yet.</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {item.relatedResources?.map((resource) => (
                <Link key={resource.id} to={`/resources/${resource.id}`} className="surface-card rounded-lg p-5">
                  <span className="badge-green">{resource.type?.replaceAll("_", " ")}</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resource.department?.name && <span className="badge">{resource.department.name}</span>}
                    {resource.courseCode && <span className="badge-gold">{resource.courseCode}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Related useful links</h2>
                <p className="mt-1 text-sm text-muted">Useful Links are reused from the existing resource system.</p>
              </div>
              <Link to={`/browse?universityId=${item.id}&type=USEFUL_LINK`} className="btn-secondary self-start">
                View all
              </Link>
            </div>

            {item.relatedUsefulLinks?.length === 0 && (
              <div className="empty-state">No approved useful links are associated with this university yet.</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {item.relatedUsefulLinks?.map((resource) => (
                <div key={resource.id} className="surface-card rounded-lg p-5">
                  <span className="badge-green">Useful Link</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a href={resource.fileUrl} className="btn-dark min-h-10 px-3 py-2" {...externalLinkProps}>
                      <ExternalLink size={15} />
                      Open link
                    </a>
                    <Link to={`/resources/${resource.id}`} className="btn-secondary min-h-10 px-3 py-2">
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Contact information</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <ContactRow icon={Phone} label="Phone">
                {item.contactPhone ? (
                  <a href={formatPhoneHref(item.contactPhone)} className="font-semibold text-highland hover:underline">
                    {item.contactPhone}
                  </a>
                ) : (
                  <span className="text-muted">Phone not available</span>
                )}
              </ContactRow>
              <ContactRow icon={Mail} label="Email">
                {item.contactEmail ? (
                  <a href={`mailto:${item.contactEmail}`} className="font-semibold text-highland hover:underline">
                    {item.contactEmail}
                  </a>
                ) : (
                  <span className="text-muted">Email not available</span>
                )}
              </ContactRow>
              <ContactRow icon={MapPin} label="Address">
                <span className="text-ink">{item.address || "Address not available"}</span>
              </ContactRow>
              {item.additionalContactInfo && (
                <ContactRow icon={Building2} label="Additional">
                  <span className="text-ink">{item.additionalContactInfo}</span>
                </ContactRow>
              )}
            </dl>
          </section>

          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Location</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoPair label="Region" value={item.region || "Not set"} />
              <InfoPair label="City" value={item.city || "Not set"} />
              <InfoPair label="Address" value={item.address || "Not set"} />
            </dl>
            {mapUrl && (
              <a href={mapUrl} className="btn-secondary mt-5 w-full" {...externalLinkProps}>
                <MapPin size={16} />
                Open map location
              </a>
            )}
          </section>

          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Library links</h2>
            {libraryLinks.length === 0 ? (
              <p className="mt-3 text-sm text-muted">University library links are not available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {libraryLinks.map((link) => (
                  <a key={link.label} href={link.url} className="btn-secondary w-full justify-between" {...externalLinkProps}>
                    <span>{link.label}</span>
                    <ExternalLink size={15} />
                  </a>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, title, label, url, missingText }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon size={17} className="text-highland" />
        {title}
      </p>
      {url ? (
        <a href={url} className="btn-secondary mt-3 w-full justify-between" {...externalLinkProps}>
          <span>{label}</span>
          <ExternalLink size={15} />
        </a>
      ) : (
        <p className="mt-3 text-sm text-muted">{missingText || `${title} not available`}</p>
      )}
    </div>
  );
}

function ContactRow({ icon: Icon, label, children }) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon size={14} className="text-highland" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function ProgramInfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon size={14} className="text-highland" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function InfoPair({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
