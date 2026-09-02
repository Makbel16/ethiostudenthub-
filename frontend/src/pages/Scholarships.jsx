import { useState } from "react";
import { Award, ExternalLink, Calendar, DollarSign, Search } from "lucide-react";

export default function Scholarships() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const scholarships = [
    {
      id: 1,
      title: "Ethiopian Government Scholarship Program",
      provider: "Ministry of Education",
      amount: "Full Tuition + Living Stipend",
      deadline: "2024-03-15",
      category: "Government",
      description: "Full scholarship for Ethiopian students pursuing undergraduate and postgraduate studies at public universities.",
      eligibility: "Ethiopian citizenship, minimum GPA of 3.0, admission to public university",
      link: "https://moe.gov.et/scholarships",
    },
    {
      id: 2,
      title: "African Leadership University Scholarship",
      provider: "African Leadership University",
      amount: "Up to $15,000/year",
      deadline: "2024-04-01",
      category: "International",
      description: "Merit-based scholarships for outstanding African students to study at ALU campuses in Rwanda or Mauritius.",
      eligibility: "African citizenship, strong academic record, leadership potential",
      link: "https://alueducation.com/scholarships",
    },
    {
      id: 3,
      title: "STEM Excellence Scholarship",
      provider: "Ethiopian STEM Initiative",
      amount: "50% Tuition Waiver",
      deadline: "2024-02-28",
      category: "STEM",
      description: "Scholarship for students excelling in Science, Technology, Engineering, and Mathematics fields.",
      eligibility: "Enrolled in STEM program, minimum GPA of 3.5, Ethiopian resident",
      link: "https://stem-ethiopia.org/scholarships",
    },
    {
      id: 4,
      title: "Women in Tech Scholarship",
      provider: "TechWomen Ethiopia",
      amount: "Full Tuition + Mentorship",
      deadline: "2024-05-15",
      category: "Women",
      description: "Empowering women in technology through full scholarships and mentorship programs.",
      eligibility: "Female student, enrolled in tech-related program, demonstrated interest in technology",
      link: "https://techwomenethiopia.org/scholarships",
    },
    {
      id: 5,
      title: "University Merit Scholarship",
      provider: "Addis Ababa University",
      amount: "100% Tuition Waiver",
      deadline: "2024-03-01",
      category: "University",
      description: "Merit-based scholarship for top-performing students at Addis Ababa University.",
      eligibility: "Current AAU student, minimum GPA of 3.8, full-time enrollment",
      link: "https://aau.edu.et/financial-aid",
    },
  ];

  const categories = ["all", "Government", "International", "STEM", "Women", "University"];

  const filteredScholarships = scholarships.filter((scholarship) => {
    const matchesSearch =
      scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || scholarship.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isDeadlineSoon = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

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

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Award size={16} />
          Student Resources
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">Scholarships</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Discover scholarship opportunities to support your academic journey.
        </p>
      </div>

      <section className="space-y-6">
        <div className="section-panel rounded-xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Search Scholarships</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, provider, or description..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="field-label">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-field"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredScholarships.length === 0 ? (
            <div className="empty-state py-12">No scholarships found matching your criteria.</div>
          ) : (
            filteredScholarships.map((scholarship) => {
              const deadlineStatus = getDeadlineStatus(scholarship.deadline);
              return (
                <div key={scholarship.id} className="section-panel rounded-xl p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="badge">{scholarship.category}</span>
                        <span className={deadlineStatus.className}>{deadlineStatus.text}</span>
                        {isDeadlineSoon(scholarship.deadline) && (
                          <span className="badge-gold">Apply Soon!</span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-ink">{scholarship.title}</h3>
                      <p className="mt-1 text-sm text-muted">{scholarship.provider}</p>
                      <p className="mt-3 text-sm leading-6 text-muted">{scholarship.description}</p>
                      
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={16} className="text-highland" />
                          <span className="font-semibold text-ink">{scholarship.amount}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-highland" />
                          <span className="text-muted">
                            Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-line bg-paper p-3">
                        <p className="text-xs font-semibold uppercase text-muted">Eligibility</p>
                        <p className="mt-1 text-sm text-ink">{scholarship.eligibility}</p>
                      </div>
                    </div>

                    <a
                      href={scholarship.link}
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
          <h2 className="mb-4 text-lg font-semibold text-ink">Scholarship Tips</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Start your scholarship search early - many deadlines are months in advance.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Read eligibility requirements carefully before applying.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Prepare strong recommendation letters and personal statements.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Apply to multiple scholarships to increase your chances.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-highland">•</span>
              Keep track of deadlines and required documents.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
