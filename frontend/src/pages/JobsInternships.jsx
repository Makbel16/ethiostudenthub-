import { useState } from "react";
import { Briefcase, ExternalLink, MapPin, Calendar, Search, Clock } from "lucide-react";

export default function JobsInternships() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const jobs = [
    {
      id: 1,
      title: "Software Developer Intern",
      company: "EthioTech Solutions",
      type: "Internship",
      location: "Addis Ababa",
      salary: "5,000 - 8,000 ETB/month",
      deadline: "2024-02-15",
      description: "Join our development team to work on innovative software solutions. Great opportunity for students to gain real-world experience.",
      requirements: "Currently enrolled in CS/IT program, basic programming knowledge, available for 3 months",
      link: "https://ethiotech.jobs/apply/software-intern",
    },
    {
      id: 2,
      title: "Data Analyst",
      company: "Bank of Abyssinia",
      type: "Full-time",
      location: "Addis Ababa",
      salary: "15,000 - 25,000 ETB/month",
      deadline: "2024-02-28",
      description: "Analyze financial data and create reports to support business decisions. Strong analytical skills required.",
      requirements: "Bachelor's degree in Statistics, CS, or related field, experience with data analysis tools",
      link: "https://bankofabyssinia.jobs/apply/data-analyst",
    },
    {
      id: 3,
      title: "Marketing Intern",
      company: "Ethiopian Airlines",
      type: "Internship",
      location: "Addis Ababa",
      salary: "4,000 ETB/month + benefits",
      deadline: "2024-03-01",
      description: "Support marketing campaigns and social media management for one of Africa's leading airlines.",
      requirements: "Marketing or Business student, strong communication skills, social media savvy",
      link: "https://ethiopianairlines.jobs/apply/marketing-intern",
    },
    {
      id: 4,
      title: "Junior Web Developer",
      company: "Sheba Software",
      type: "Full-time",
      location: "Hawassa",
      salary: "12,000 - 18,000 ETB/month",
      deadline: "2024-03-15",
      description: "Build and maintain web applications for clients. Work with modern frameworks and technologies.",
      requirements: "Bachelor's in CS or equivalent, proficiency in HTML/CSS/JavaScript, portfolio required",
      link: "https://shebasoftware.jobs/apply/web-developer",
    },
    {
      id: 5,
      title: "Research Assistant",
      company: "Ethiopian Institute of Agricultural Research",
      type: "Part-time",
      location: "Addis Ababa",
      salary: "8,000 ETB/month",
      deadline: "2024-02-20",
      description: "Assist with agricultural research projects and data collection. Perfect for students in agricultural sciences.",
      requirements: "Enrolled in Agricultural Science program, research experience preferred",
      link: "https://eiar.gov.et/jobs/research-assistant",
    },
  ];

  const jobTypes = ["all", "Full-time", "Part-time", "Internship"];
  const locations = ["all", "Addis Ababa", "Hawassa", "Dire Dawa", "Remote"];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || job.type === selectedType;
    const matchesLocation = selectedLocation === "all" || job.location === selectedLocation;
    return matchesSearch && matchesType && matchesLocation;
  });

  const getDeadlineStatus = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Closed", className: "badge-gold" };
    if (diffDays <= 7) return { text: `${diffDays} days left`, className: "badge-gold" };
    if (diffDays <= 30) return { text: `${diffDays} days left`, className: "badge" };
    return { text: `${diffDays} days left`, className: "badge-green" };
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Full-time":
        return "badge-green";
      case "Part-time":
        return "badge";
      case "Internship":
        return "badge-gold";
      default:
        return "badge";
    }
  };

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Briefcase size={16} />
          Student Resources
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Jobs & Internships</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Explore job opportunities and internships to kickstart your career.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="field-label">Search Jobs</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, company, or description..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="field-label">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="select-field"
              >
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="select-field"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="empty-state py-12">No jobs found matching your criteria.</div>
          ) : (
            filteredJobs.map((job) => {
              const deadlineStatus = getDeadlineStatus(job.deadline);
              return (
                <div key={job.id} className="section-panel rounded-xl p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={getTypeBadge(job.type)}>{job.type}</span>
                        <span className="badge">{job.location}</span>
                        <span className={deadlineStatus.className}>{deadlineStatus.text}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-ink">{job.title}</h3>
                      <p className="mt-1 text-sm text-muted">{job.company}</p>
                      <p className="mt-3 text-sm leading-6 text-muted">{job.description}</p>
                      
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase size={16} className="text-highland" />
                          <span className="font-semibold text-ink">{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-highland" />
                          <span className="text-muted">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-highland" />
                          <span className="text-muted">
                            Deadline: {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-line bg-paper p-3 dark:bg-dark-surface dark:border-dark-border">
                        <p className="text-xs font-semibold uppercase text-muted dark:text-dark-muted">Salary</p>
                        <p className="mt-1 text-sm font-semibold text-ink dark:text-dark-text">{job.salary}</p>
                      </div>

                      <div className="mt-3 rounded-lg border border-line bg-paper p-3 dark:bg-dark-surface dark:border-dark-border">
                        <p className="text-xs font-semibold uppercase text-muted dark:text-dark-muted">Requirements</p>
                        <p className="mt-1 text-sm text-ink dark:text-dark-text">{job.requirements}</p>
                      </div>
                    </div>

                    <a
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary min-h-10 px-4 shrink-0"
                    >
                      <ExternalLink size={16} />
                      Apply Now
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="section-panel rounded-xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">Job Search Tips</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Tailor your resume and cover letter for each application.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Build a strong portfolio showcasing your skills and projects.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Network with professionals in your field through LinkedIn and events.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Prepare for interviews by researching the company and practicing common questions.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Consider internships as a pathway to full-time positions.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
