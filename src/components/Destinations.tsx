"use client";

import React, { useState } from "react";

export default function Destinations() {
  const [activeSlide2, setActiveSlide2] = useState(0);
  const backgrounds2 = ["/tea.png", "/miris.png", "/maliga.png", "/ella.png"];

  return (
    <section id="destinations" className="relative bg-slate-900 px-6 py-40 min-h-[120vh] overflow-hidden scroll-mt-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgrounds2[activeSlide2]}
        alt="Sri Lanka Destination"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
      />

      <div data-aos="fade-up" data-aos-duration="1000" className="relative z-10 flex flex-col justify-between h-[65vh] max-w-5xl mt-20 lg:mt-32 ml-6 md:ml-24 lg:ml-32 pointer-events-none">
        {/* Top Header Section */}
        <div className="pointer-events-auto">
          <p className="text-amber-400 text-xl sm:text-2xl font-bold mb-2 tracking-wide">
            Island Wonders
          </p>
          <h2 className="text-white text-6xl sm:text-8xl font-extrabold leading-tight drop-shadow-xl">
            Top Sri Lanka <br /> Destinations
          </h2>
        </div>
      </div>

      {/* Vertical Slider Indicator */}
      <div className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-16 z-20">
        <div className="absolute top-2 bottom-2 w-[4px] bg-white/40 -z-10" />

        {backgrounds2.map((_, index) => (
          <div
            key={index}
            onClick={() => setActiveSlide2(index)}
            className={
              index === activeSlide2
                ? "w-8 h-8 rounded-full bg-amber-400 ring-8 ring-white/30 cursor-pointer transition-transform duration-300"
                : "w-6 h-6 rounded-full bg-white cursor-pointer hover:bg-white/80 transition-colors"
            }
          />
        ))}
      </div>
    </section>
  );
}
