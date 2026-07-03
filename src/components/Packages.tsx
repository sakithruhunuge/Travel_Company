"use client";

import Image from "next/image";
import { sriLankaPackages } from "@/data/packages";
import { useTravelRequest } from "@/context/TravelRequestContext";

export default function Packages() {
  const { openFormModal } = useTravelRequest();
  return (
    <section id="packages" className="py-24 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Curated Escapes
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            Featured Sri Lanka Packages
          </h2>
          <p className="text-base text-slate-500">
            Handpicked premium tours that combine comfort, adventure, and immersive local experiences. Explore Sri Lanka with our carefully crafted travel packages.
          </p>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sriLankaPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="group bg-white rounded-[32px] overflow-hidden border border-slate-100/80 shadow-sm hover:shadow-2xl hover:shadow-brand-secondary/10 transition-all duration-500 hover:translate-y-[-6px] flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={pkg.image}
                  alt={pkg.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm z-10">
                  <svg
                    className="w-3.5 h-3.5 text-brand-primary fill-brand-primary"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {pkg.rating}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 flex flex-col flex-grow space-y-5 text-left">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-lg font-black text-brand-dark group-hover:text-brand-secondary transition-colors leading-tight">
                      {pkg.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2.5 text-slate-400">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-500">{pkg.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                    <span className="text-lg font-black text-brand-secondary whitespace-nowrap">
                      {pkg.priceRange}
                    </span>
                  </div>
                </div>

                {/* Destinations */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Destinations</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {pkg.destinations.map((dest, i) => (
                      <span key={i} className="inline-flex bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-semibold">
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Inclusions */}
                <div className="space-y-2 flex-grow">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Includes</span>
                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    {pkg.includes.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                        <span className="text-brand-secondary font-black text-[10px]">✔</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openFormModal(pkg.id)}
                    className="block w-full text-center py-3 bg-brand-primary/10 hover:bg-brand-primary hover:text-brand-dark text-brand-primary hover:shadow-md hover:shadow-brand-primary/15 rounded-xl font-bold transition-all duration-300 cursor-pointer"
                  >
                    Select this Package
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
