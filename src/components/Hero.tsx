"use client";

import Image from "next/image";
import { useState } from "react";
import { useTravelRequest } from "@/context/TravelRequestContext";

const DESTINATIONS = ["Kandy", "Ella", "Mirissa", "Sigiriya", "Galle"];
const BUDGETS = ["$100 - $300", "$300 - $600", "$600 - $1000", "$1000+"];

export default function Hero() {
  const { openFormModal } = useTravelRequest();
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState(BUDGETS[0]);

  return (
    <section
      id="home"
      className="relative bg-white py-24 lg:py-32 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text + Search */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 animate-fade-in-up"
              style={{ animationDelay: "150ms", animationFillMode: "both" }}
            >
              Explore the Pearl of the Indian Ocean
            </span>

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
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 bg-white rounded-2xl sm:rounded-full border border-black/10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-3 sm:p-2 sm:pl-6 max-w-2xl"
              >
                <label className="flex-1 sm:pr-4 sm:border-r sm:border-black/10">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Destination
                  </span>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full text-sm font-semibold text-brand-dark bg-transparent outline-none py-1"
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex-1 sm:px-4 sm:border-r sm:border-black/10">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Travel Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm font-semibold text-brand-dark bg-transparent outline-none py-1"
                  />
                </label>

                <label className="flex-1 sm:px-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Budget
                  </span>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full text-sm font-semibold text-brand-dark bg-transparent outline-none py-1"
                  >
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="shrink-0 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 hover:scale-[1.03] active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
                >
                  Plan My Trip
                </button>
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

          {/* Illustration */}
          <div
            className="lg:col-span-6 relative animate-scale-in"
            style={{ animationDelay: "450ms", animationFillMode: "both" }}
          >
            <div className="relative mx-auto max-w-xl aspect-square">
              {/* Main image */}
              <div className="relative w-full h-full rounded-[45%_55%_60%_40%/50%_45%_55%_50%] overflow-hidden">
                <Image
                  src="/images/hero-traveler-new.png"
                  alt="Young woman traveler in Sri Lanka"
                  fill
                  priority
                  className="object-contain object-center"
                  sizes="(min-width: 1024px) 900px, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
