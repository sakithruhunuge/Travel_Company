"use client";

import { useTravelRequest } from "@/context/TravelRequestContext";

const DEFAULT_PACKAGES = [
  {
    id: "pkg-1",
    title: "Cultural Triangle Explorer",
    price: "$450 - $550",
    image: "/sigiri.png",
    tags: ["6 Days", "Heritage", "Guided Tours"],
  },
  {
    id: "pkg-2",
    title: "Southern Beach Escape",
    price: "$455 - $600",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop",
    tags: ["5 Days", "Relaxation", "Coastal"],
  },
  {
    id: "pkg-3",
    title: "Wildlife Safari Experience",
    price: "$495 - $600",
    image: "https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=800&auto=format&fit=crop",
    tags: ["4 Days", "Safari", "Adventure"],
  },
  {
    id: "pkg-4",
    title: "Heritage & Temples Discovery",
    price: "$450 - $550",
    image: "/pilima.png",
    tags: ["6 Days", "Heritage", "Guided Tours"],
  },
  {
    id: "pkg-5",
    title: "Southern Coastal Sunset Voyage",
    price: "$455 - $600",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop",
    tags: ["5 Days", "Relaxation", "Coastal"],
  },
];

export default function Packages() {
  const { openFormModal } = useTravelRequest();

  return (
    <section id="packages" className="bg-white px-6 py-12 md:py-16 scroll-mt-16">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <p data-aos="fade-up" className="text-amber-500 font-bold text-xs tracking-wider uppercase mb-1">Curated Escapes</p>
        <h2 data-aos="fade-up" data-aos-delay="100" className="text-slate-900 text-2xl sm:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
          Featured Sri Lanka Packages
        </h2>
        <p data-aos="fade-up" data-aos-delay="200" className="text-slate-500 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
          Handpicked premium tours that combine comfort, adventure, and immersive local experiences. Explore Sri Lanka with our carefully crafted travel packages.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEFAULT_PACKAGES.map((pkg, idx) => (
          <div
            key={`${pkg.id}-${idx}`}
            data-aos="fade-up"
            data-aos-delay={idx * 100}
            className="rounded-xl bg-slate-900 overflow-hidden shadow-md flex flex-col transition-transform duration-300 hover:-translate-y-1.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pkg.image} alt={pkg.title} className="h-40 w-full object-cover" />
            <div className="p-4 flex flex-col gap-2.5 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-bold text-sm sm:text-base leading-snug">{pkg.title}</h3>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-white/50 uppercase tracking-wide">From</p>
                  <p className="text-amber-400 font-bold text-xs sm:text-sm">{pkg.price}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pkg.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] uppercase tracking-wide bg-white/10 text-white/80 rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openFormModal(pkg.id)}
                className="mt-auto w-full rounded-lg bg-amber-400 text-slate-900 text-xs font-bold py-2 hover:bg-amber-300 transition-colors"
              >
                Select This Package
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
