export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <p className="font-display text-lg mb-2">EthioStudentHub</p>
          <p className="text-ink/60">Built by students, for students — across every Ethiopian university.</p>
        </div>
        <div>
          <p className="font-medium mb-2 course-tab text-highland">SUPPORT</p>
          <ul className="space-y-1 text-ink/70">
            <li>Contact</li>
            <li>FAQ</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2 course-tab text-highland">LEGAL</p>
          <ul className="space-y-1 text-ink/70">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2 course-tab text-highland">FOLLOW</p>
          <ul className="space-y-1 text-ink/70">
            <li>Telegram</li>
            <li>Instagram</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
