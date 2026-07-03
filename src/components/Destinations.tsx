"use client";

import Image from "next/image";
import { sriLankaImages } from "@/constants/sriLankaImages";

export default function Destinations() {
  return (
    <section id="destinations" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Island Wonders
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            Top Sri Lanka Destinations
          </h2>
          <p className="text-base text-slate-500">
            From ancient archaeological ruins and sacred mountain shrines to misty hills and surf-friendly coastal shores.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sriLankaImages.destinations.map((dest, idx) => {
            // Helper to get category tag
            const getTag = (title: string) => {
              if (title.includes("Beach") || title.includes("Mirissa") || title.includes("Bentota")) return "Coastline";
              if (title.includes("Temple") || title.includes("Tooth") || title.includes("Fort") || title.includes("Sigiriya")) return "Heritage";
              if (title.includes("Tea") || title.includes("Bridge") || title.includes("Ella")) return "Highlands";
              if (title.includes("Safari") || title.includes("Park")) return "Wildlife";
              return "Urban";
            };

            const tag = getTag(dest.title);
            const isLarge = idx === 0 || idx === 5; // Sigiriya and Safari span 2 columns

            return (
              <div
                key={idx}
                className={`group relative rounded-[28px] overflow-hidden aspect-[4/5] sm:aspect-[3/4] md:aspect-auto md:h-[340px] shadow-sm hover:shadow-2xl hover:shadow-brand-secondary/15 transition-all duration-500 hover:translate-y-[-6px] border border-slate-100 ${
                  isLarge ? "md:col-span-2" : "md:col-span-1"
                }`}
              >
                {/* Category Tag */}
                <span className="absolute top-4 left-4 z-20 text-[10px] font-bold tracking-widest text-brand-primary bg-brand-dark/80 backdrop-blur-md px-3 py-1.5 rounded-full uppercase border border-white/10">
                  {tag}
                </span>

                {/* Destination Image */}
                <Image
                  src={dest.imageUrl}
                  alt={dest.title}
                  fill
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent z-10" />

                {/* Text / Attribution Card Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-left z-20">
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight">
                    {dest.title}
                  </h3>
                  <span className="text-[10px] text-slate-300 font-semibold mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {dest.imageCredit} &bull; {dest.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
