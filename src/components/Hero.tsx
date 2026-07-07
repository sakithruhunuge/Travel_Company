"use client";

import Image from "next/image";
import { useState } from "react";
import { useTravelRequest } from "@/context/TravelRequestContext";

const DESTINATIONS = ["Kandy", "Ella", "Mirissa", "Sigiriya", "Galle", "Nuwara Eliya", "Trincomalee", "Jaffna"];
const BUDGETS = ["$100 - $300", "$300 - $600", "$600 - $1000", "$1000+", "$2000+ Luxury"];

export default function Hero() {
  const { openFormModal } = useTravelRequest();
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState(BUDGETS[0]);

  return (
    <section
      id="home"
      className="relative bg-white py-16 lg:py-20 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text + Search */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <h1
              className="text-4xl sm:text-6xl font-black tracking-tight text-brand-dark leading-[1.1] animate-fade-in-up"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              Explore Beautiful
              <br />
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-400">
                Sri Lanka
                <svg
                  className="absolute -top-2 -right-8 w-6 h-6 text-brand-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0l2.2 7.3L22 9.5l-7.3 2.2L12 19l-2.2-7.3L2 9.5l7.8-2.2L12 0z" />
                </svg>
              </span>
            </h1>

            <p
              className="text-lg text-brand-dark/60 leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: "450ms", animationFillMode: "both" }}
            >
              From ancient kingdoms and misty mountains to golden beaches and
              unforgettable wildlife experiences, explore Sri Lanka with
              carefully crafted travel packages.
            </p>

            {/* Search / filter bar */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "600ms", animationFillMode: "both" }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openFormModal();
                }}
                className="flex flex-col gap-4 bg-white rounded-3xl border border-black/10 shadow-[0_15px_50px_rgba(0,0,0,0.08)] p-6 max-w-2xl"
              >
                {/* Row 1: Destination + Travel Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destination
                    </span>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full text-sm font-semibold text-brand-dark bg-brand-light/50 rounded-xl px-3 py-2.5 border border-black/5 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    >
                      {DESTINATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Travel Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-sm font-semibold text-brand-dark bg-brand-light/50 rounded-xl px-3 py-2.5 border border-black/5 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    />
                  </label>
                </div>

                {/* Row 2: Budget + Travelers + Button */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <label className="sm:col-span-4 flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Budget
                    </span>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full text-sm font-semibold text-brand-dark bg-brand-light/50 rounded-xl px-3 py-2.5 border border-black/5 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    >
                      {BUDGETS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="sm:col-span-3 flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Travelers
                    </span>
                    <select className="w-full text-sm font-semibold text-brand-dark bg-brand-light/50 rounded-xl px-3 py-2.5 border border-black/5 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Traveler" : "Travelers"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="sm:col-span-5 shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-primary to-orange-400 hover:from-brand-primary/90 hover:to-orange-400/90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:shadow-brand-primary/35 transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Plan My Trip
                  </button>
                </div>

                {/* Popular destinations quick links */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Popular:
                  </span>
                  {["Sigiriya", "Ella", "Mirissa", "Galle"].map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => setDestination(place)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${destination === place
                        ? "bg-brand-primary text-white"
                        : "bg-brand-light/50 text-brand-dark/70 hover:bg-brand-light hover:text-brand-dark"
                        }`}
                    >
                      {place}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            <div
              className="flex items-center gap-6 pt-2 animate-fade-in-up"
              style={{ animationDelay: "750ms", animationFillMode: "both" }}
            >
              <a
                href="#packages"
                className="text-sm font-bold text-brand-dark underline decoration-brand-primary decoration-2 underline-offset-4 hover:text-brand-primary transition-colors"
              >
                Browse all packages
              </a>
            </div>
          </div>

          {/* Illustration - Proportioned to match search section */}
          <div
            className="lg:col-span-6 relative animate-scale-in"
            style={{ animationDelay: "450ms", animationFillMode: "both" }}
          >
            <div className="relative mx-auto w-[160%] max-w-none aspect-[4/5] flex items-center justify-center -mr-12 lg:-mr-16 -ml-12 lg:-ml-16">
              <Image
                src="/images/hero-traveler-new.png"
                alt="Young woman traveler in Sri Lanka"
                width={1100}
                height={1375}
                priority
                className="w-full h-auto max-h-full object-contain scale-105 hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}