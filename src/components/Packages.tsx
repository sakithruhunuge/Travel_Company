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
    <section id="packages" className="bg-white px-6 py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <p data-aos="fade-up" className="text-amber-500 font-bold tracking-wide uppercase mb-2">Curated Escapes</p>
        <h2 data-aos="fade-up" data-aos-delay="100" className="text-slate-900 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
          Featured Sri Lanka <br className="hidden md:block" /> Packages
        </h2>
        <p data-aos="fade-up" data-aos-delay="200" className="text-slate-500 max-w-2xl mx-auto text-lg">
          Handpicked premium tours that combine comfort, adventure, and immersive local experiences. Explore Sri Lanka with our carefully crafted travel packages.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_PACKAGES.map((pkg, idx) => (
          <div
            key={`${pkg.id}-${idx}`}
            data-aos="fade-up"
            data-aos-delay={idx * 100}
            className="rounded-2xl bg-slate-900 overflow-hidden shadow-lg flex flex-col transition-transform duration-300 hover:-translate-y-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pkg.image} alt={pkg.title} className="h-48 w-full object-cover" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-bold leading-snug text-lg">{pkg.title}</h3>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">From</p>
                  <p className="text-amber-400 font-bold text-sm">{pkg.price}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-wide bg-white/10 text-white/80 rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openFormModal(pkg.id)}
                className="mt-auto w-full rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold py-2.5 hover:bg-amber-300 transition-colors"
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
