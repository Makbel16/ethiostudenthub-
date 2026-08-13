export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="page-shell py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">EthioStudentHub</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              A focused academic resource platform for Ethiopian students, organized by university,
              department, course, year, and exam type.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">Platform</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="/browse" className="hover:text-highland">Browse resources</a></li>
              <li><a href="/browse?type=PREVIOUS_EXAM" className="hover:text-highland">Previous exams</a></li>
              <li><a href="/upload" className="hover:text-highland">Upload material</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Students</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="/dashboard" className="hover:text-highland">Dashboard</a></li>
              <li><a href="/login" className="hover:text-highland">Log in</a></li>
              <li><a href="/register" className="hover:text-highland">Create account</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Trust</p>
            <ul className="space-y-2 text-sm text-muted">
              <li>Moderated uploads</li>
              <li>University structure</li>
              <li>Course-based discovery</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>EthioStudentHub MVP. Built for clear academic resource discovery.</p>
          <p>Frontend communicates with the configured backend API.</p>
        </div>
      </div>
    </footer>
  );
}
