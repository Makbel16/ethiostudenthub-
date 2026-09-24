import React from "react";
import { Link } from "react-router-dom";
import { Building2, Sparkles, MapPin } from "lucide-react";

const CAMPUSES = [
  { name: "Addis Ababa University", code: "AAU", city: "Addis Ababa", est: "1950", color: "from-emerald-600 to-green-700" },
  { name: "Adama Science & Technology", code: "ASTU", city: "Adama, Oromia", est: "1993", color: "from-amber-600 to-yellow-600" },
  { name: "Addis Ababa Science & Tech", code: "AASTU", city: "Akaki, Addis Ababa", est: "2011", color: "from-blue-600 to-cyan-700" },
  { name: "Jimma University", code: "JU", city: "Jimma, Oromia", est: "1983", color: "from-purple-600 to-indigo-700" },
  { name: "Hawassa University", code: "HU", city: "Hawassa, Sidama", est: "2000", color: "from-teal-600 to-emerald-700" },
  { name: "Bahir Dar University", code: "BDU", city: "Bahir Dar, Amhara", est: "1953", color: "from-blue-600 to-sky-700" },
  { name: "University of Gondar", code: "UoG", city: "Gondar, Amhara", est: "1954", color: "from-rose-600 to-red-700" },
  { name: "Haramaya University", code: "Haramaya", city: "Dire Dawa", est: "1954", color: "from-orange-600 to-amber-700" },
  { name: "Arba Minch University", code: "AMU", city: "Arba Minch, South", est: "1986", color: "from-cyan-600 to-blue-700" },
  { name: "Debre Berhan University", code: "DBU", city: "Debre Berhan", est: "2007", color: "from-emerald-700 to-teal-800" },
  { name: "Wolaita Sodo University", code: "WSU", city: "Wolaita Sodo", est: "2007", color: "from-indigo-600 to-violet-700" },
  { name: "Wollo University", code: "WU", city: "Dessie, Amhara", est: "2005", color: "from-green-600 to-emerald-800" },
];

export default function CampusMarquee() {
  return (
    <div className="relative w-full overflow-hidden border-y border-line/70 bg-surface/80 py-6 backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/80">
      {/* Subtle edge fade gradients */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent dark:from-dark-bg" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent dark:from-dark-bg" />

      <div className="flex w-max animate-marquee gap-4">
        {[...CAMPUSES, ...CAMPUSES].map((campus, idx) => (
          <Link
            key={`${campus.code}-${idx}`}
            to="/universities"
            className="group flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:border-highland/50 hover:shadow-md dark:border-dark-border dark:bg-dark-border/40"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${campus.color} text-white font-bold text-xs shadow-sm`}>
              {campus.code}
            </div>
            <div className="text-left whitespace-nowrap">
              <p className="font-semibold text-xs text-ink dark:text-white group-hover:text-highland transition-colors">
                {campus.name}
              </p>
              <p className="text-[10px] text-muted dark:text-dark-muted flex items-center gap-1">
                <MapPin size={10} /> {campus.city}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
