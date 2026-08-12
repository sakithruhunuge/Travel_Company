"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Menu } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const DESTINATIONS = ["Kandy", "Ella", "Mirissa", "Sigiriya", "Galle", "Nuwara Eliya", "Trincomalee", "Jaffna"];
const BUDGETS = ["$100 - $300", "$300 - $600", "$600 - $1000", "$1000+"];

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
  const backgrounds = ["/sigiri.png", "/col.png", "/pilima.png", "/chita.png"];

  const [destination, setDestination] = useState("Kandy");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("$100 - $300");

  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${locale}/customize-tour`);
  };

  return (
    <section id="about" className="scroll-mt-20">
      {/* ===== INTRO / PLAN STRIP ===== */}
      <div className="bg-amber-400 px-6 py-10">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-6">
          <p data-aos="fade-right" data-aos-duration="900" className="text-slate-900 font-semibold text-2xl sm:text-4xl leading-snug max-w-4xl">
            From ancient kingdoms and misty mountains to golden beaches and unforgettable
            wildlife experiences, explore Sri Lanka with carefully crafted travel packages.
          </p>
          <button
            data-aos="fade-left" data-aos-delay="200"
            className="hidden sm:flex shrink-0 h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white"
            aria-label="More info"
          >
            <Menu size={20} />
          </button>
        </div>

        <form
          onSubmit={handlePlanTrip}
          data-aos="fade-up" data-aos-delay="300"
          className="max-w-7xl mx-auto mt-8 flex flex-col sm:flex-row items-stretch gap-3 rounded-2xl bg-white p-3 shadow-lg"
        >
          <div className="flex-1 px-4 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Destination</p>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex-1 px-4 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Travel Date</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <div className="hidden sm:block w-px bg-slate-200" />
          <div className="flex-1 px-4 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Budget</p>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {BUDGETS.map((b) => (
                <option key={b} value={b}>{formatPriceString(b)}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="shrink-0 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
            Plan My Trip
          </button>
        </form>

        <div className="max-w-7xl mx-auto w-full flex justify-end">
          <a
            href="#packages"
            className="mt-5 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700 transition-colors"
          >
            Browse All Packages
          </a>
        </div>
      </div>

      {/* ===== WHY VISIT ===== */}
      <div className="relative bg-slate-900 px-6 py-10 min-h-[120vh] overflow-hidden flex flex-col justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgrounds[activeSlide]}
          alt="Sri Lanka Destination"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        />

        <div data-aos="fade-up" data-aos-duration="1000" className="relative z-10 max-w-4xl mb-16 ml-6 md:ml-20 lg:ml-32">
          <h2 className="text-white text-6xl sm:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            Why Visit
            <br />
            Sri Lanka?
          </h2>
          <p className="text-white font-normal text-xl sm:text-2xl leading-relaxed max-w-3xl drop-shadow-md">
            Sri Lanka is an island paradise packing diverse, breathtaking travel experiences
            into a compact destination. Known as the &ldquo;Pearl of the Indian Ocean&rdquo;, it caters to
            every type of global traveler.
          </p>
        </div>

        {/* Vertical Slider Indicator */}
        <div className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-16 z-20">
          <div className="absolute top-2 bottom-2 w-[4px] bg-white/40 -z-10" />

          {backgrounds.map((_, index) => (
            <div
              key={index}
              onClick={() => setActiveSlide(index)}
              className={
                index === activeSlide
                  ? "w-8 h-8 rounded-full bg-amber-400 ring-8 ring-white/30 cursor-pointer transition-transform duration-300"
                  : "w-6 h-6 rounded-full bg-white cursor-pointer hover:bg-white/80 transition-colors"
              }
            />
          ))}
        </div>
      </div>

      {/* ===== HIGHLIGHTS STRIP ===== */}
      <div className="relative bg-amber-400 px-6 py-16">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-6">
          <ul className="space-y-8 w-full">
            {HIGHLIGHTS.map((h, i) => (
              <li key={h.title} data-aos="fade-right" data-aos-delay={i * 150} className="flex gap-4 items-start">
                <span className="mt-2 h-3 w-3 shrink-0 rounded-full border-2 border-black" />
                <div>
                  <p className="text-black font-bold uppercase tracking-wide text-2xl sm:text-3xl">{h.title}</p>
                  <p className="text-black/80 text-lg sm:text-xl mt-2 max-w-3xl">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
