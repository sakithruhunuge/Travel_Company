"use client";

import React, { useState } from "react";

const DESTINATIONS_DATA = [
  { name: "Nuwara Eliya", bg: "/images/tea.png" },
  { name: "Mirissa Beach", bg: "/images/mirissa.png" },
  { name: "Temple of the Tooth, Kandy", bg: "/images/kandy.png" },
  { name: "Ella Nine Arch Bridge", bg: "/images/nine_arch.png" },
];

export default function Destinations() {
  const [activeSlide2, setActiveSlide2] = useState(0);

  return (
    <section id="destinations" className="relative bg-slate-900 pt-12 md:pt-16 pb-20 min-h-[60vh] md:min-h-[70vh] scroll-mt-16 flex flex-col justify-start overflow-hidden">
      {/* Clean Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DESTINATIONS_DATA[activeSlide2].bg}
        alt={DESTINATIONS_DATA[activeSlide2].name}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
      />

      {/* Main Content Box */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 w-full relative z-10">
        <div data-aos="fade-up" data-aos-duration="1000" className="max-w-xl text-left pointer-events-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/30 mb-3 shadow-md">
            Island Wonders
          </span>
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-2xl">
            Top Sri Lanka Destinations
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed drop-shadow-md max-w-md">
            Explore handpicked tropical beaches, ancient kingdoms, tea estates, and wild nature reserves across the island.
          </p>
        </div>
      </div>

      {/* Active Location Badge - Bottom Right Corner */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-16 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-400/40 shadow-xl">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-white text-xs sm:text-sm font-bold tracking-wide">
          {DESTINATIONS_DATA[activeSlide2].name}
        </span>
      </div>

      {/* Vertical Slider Indicator */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-20">
        <div className="absolute top-2 bottom-2 w-[2.5px] bg-white/30 -z-10" />

        {DESTINATIONS_DATA.map((_, index) => (
          <div
            key={index}
            onClick={() => setActiveSlide2(index)}
            className={
              index === activeSlide2
                ? "w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-white/30 cursor-pointer transition-transform duration-300 scale-110"
                : "w-2.5 h-2.5 rounded-full bg-white/80 cursor-pointer hover:bg-white transition-colors"
            }
          />
        ))}
      </div>
    </section>
  );
}
