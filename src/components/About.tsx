"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Menu } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const DESTINATIONS = ["Kandy", "Ella", "Mirissa", "Sigiriya", "Galle", "Nuwara Eliya", "Trincomalee", "Jaffna"];
const BUDGETS = ["$100 - $300", "$300 - $600", "$600 - $1000", "$1000+"];

const WHY_VISIT_SLIDES = [
  { name: "Sigiriya Rock Fortress", bg: "/images/sigiriya.png" },
  { name: "Colombo Skyline", bg: "/images/colombo.png" },
  { name: "Ancient Galle Fort", bg: "/images/galle.png" },
  { name: "Yala National Park Safari", bg: "/images/yala.png" },
];

const HIGHLIGHTS = [
  {
    title: "Ancient World Heritage",
    body: "Explore over 2,500 years of civilization, featuring 8 UNESCO World Heritage sites including Sigiriya and Kandy.",
  },
  {
    title: "Scenic Misty Mountains",
    body: "Ride the world-famous blue train through cascading tea estates, green hills, and waterfalls in Ella and Nuwara Eliya.",
  },
  {
    title: "Rich Wildlife Safaris",
    body: "Embark on open jeep safaris in Yala or Udawalawe to see high leopard densities, sloth bears, and giant elephant herds.",
  },
];

export default function About() {
  const router = useRouter();
  const locale = useLocale();
  const { formatPriceString } = useCurrency();
  const [activeSlide, setActiveSlide] = useState(0);

  const [destination, setDestination] = useState("Kandy");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("$100 - $300");

  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${locale}/customize-tour`);
  };

  return (
    <section id="about" className="scroll-mt-16">
      {/* ===== INTRO / PLAN STRIP ===== */}
      <div className="bg-amber-400 px-6 py-8 md:py-10">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <p data-aos="fade-right" data-aos-duration="900" className="text-slate-900 font-semibold text-xl sm:text-2xl lg:text-3xl leading-snug max-w-3xl">
            From ancient kingdoms and misty mountains to golden beaches and unforgettable
            wildlife experiences, explore Sri Lanka with carefully crafted travel packages.
          </p>
          <button
            data-aos="fade-left" data-aos-delay="200"
            className="hidden sm:flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white"
            aria-label="More info"
          >
            <Menu size={18} />
          </button>
        </div>

        <form
          onSubmit={handlePlanTrip}
          data-aos="fade-up" data-aos-delay="300"
          className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row items-stretch gap-2.5 rounded-xl bg-white p-2.5 shadow-md"
        >
          <div className="flex-1 px-3 py-1.5">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Destination</p>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex-1 px-3 py-1.5">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Travel Date</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex-1 px-3 py-1.5">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Budget</p>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {BUDGETS.map((b) => (
                <option key={b} value={b}>{formatPriceString(b)}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors">
            Plan My Trip
          </button>
        </form>

        <div className="max-w-6xl mx-auto w-full flex justify-end">
          <a
            href="#packages"
            className="mt-3 text-xs font-bold text-slate-900 underline underline-offset-4 hover:text-slate-700 transition-colors"
          >
            Browse All Packages
          </a>
        </div>
      </div>

      {/* ===== WHY VISIT ===== */}
      <div className="relative bg-slate-900 py-20 md:py-28 min-h-[60vh] md:min-h-[70vh] flex flex-col justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WHY_VISIT_SLIDES[activeSlide].bg}
          alt={WHY_VISIT_SLIDES[activeSlide].name}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        />

        <div className="max-w-6xl mx-auto px-6 sm:px-8 w-full relative z-10">
          <div data-aos="fade-up" data-aos-duration="1000" className="max-w-xl text-left pointer-events-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/30 mb-3 shadow-md">
              Discover Sri Lanka
            </span>
            <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-2xl">
              Why Visit Sri Lanka?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed drop-shadow-md max-w-md">
              Sri Lanka is an island paradise packing diverse, breathtaking travel experiences into a compact destination. Known as the &ldquo;Pearl of the Indian Ocean&rdquo;, it caters to every type of global traveler.
            </p>
          </div>
        </div>

        {/* Active Location Badge - Bottom Right Corner */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-16 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-400/40 shadow-xl">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-white text-xs sm:text-sm font-bold tracking-wide">
            {WHY_VISIT_SLIDES[activeSlide].name}
          </span>
        </div>

        {/* Vertical Slider Indicator */}
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-20">
          <div className="absolute top-2 bottom-2 w-[2.5px] bg-white/30 -z-10" />

          {WHY_VISIT_SLIDES.map((_, index) => (
            <div
              key={index}
              onClick={() => setActiveSlide(index)}
              className={
                index === activeSlide
                  ? "w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-white/30 cursor-pointer transition-transform duration-300 scale-110"
                  : "w-2.5 h-2.5 rounded-full bg-white/80 cursor-pointer hover:bg-white transition-colors"
              }
            />
          ))}
        </div>
      </div>

      {/* ===== HIGHLIGHTS STRIP ===== */}
      <div className="relative bg-amber-400 px-6 py-12">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <ul className="space-y-6 w-full">
            {HIGHLIGHTS.map((h, i) => (
              <li key={h.title} data-aos="fade-right" data-aos-delay={i * 150} className="flex gap-3.5 items-start">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-black" />
                <div>
                  <p className="text-black font-extrabold uppercase tracking-wide text-base sm:text-lg">{h.title}</p>
                  <p className="text-black/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
