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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {sriLankaImages.destinations.map((dest, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px]"
            >
              {/* Destination Image */}
              <Image
                src={dest.imageUrl}
                alt={dest.title}
                fill
                loading="lazy"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Text / Attribution Card Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end text-left">
                <h3 className="text-base font-bold text-white leading-tight">
                  {dest.title}
                </h3>
                <span className="text-[10px] text-slate-300 font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {dest.imageCredit} / {dest.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
