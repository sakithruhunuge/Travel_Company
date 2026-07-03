"use client";

import Image from "next/image";
import { sriLankaImages } from "@/constants/sriLankaImages";
import { useTravelRequest } from "@/context/TravelRequestContext";

export default function Hero() {
  const { openFormModal } = useTravelRequest();
  return (
    <section id="home" className="relative bg-brand-dark py-32 overflow-hidden flex items-center min-h-[90vh]">
      {/* Background Image using Next.js Image component */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={sriLankaImages.hero.imageUrl}
          alt={sriLankaImages.hero.title}
          fill
          priority
          className="object-cover animate-float-slow"
          sizes="100vw"
        />
        {/* Dark overlays to maintain text readability */}
        <div className="absolute inset-0 bg-brand-dark/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-brand-dark/40 z-10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/15 border border-brand-primary/30 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: "150ms", animationFillMode: "both" }}
            >
              Explore the Pearl of the Indian Ocean
            </span>
            <h1
              className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15] animate-fade-in-up"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              Discover the Beauty <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-orange-300 to-brand-primary">
                of Sri Lanka
              </span>
            </h1>
            <p
              className="text-lg text-white/75 leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: "450ms", animationFillMode: "both" }}
            >
              From ancient kingdoms and misty mountains to golden beaches and unforgettable wildlife experiences, explore Sri Lanka with carefully crafted travel packages.
            </p>
            <div
              className="flex flex-wrap gap-4 pt-2 animate-fade-in-up"
              style={{ animationDelay: "600ms", animationFillMode: "both" }}
            >
              <a
                href="#packages"
                className="px-8 py-4 rounded-full text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-[0_8px_30px_rgb(255,139,80,0.3)] hover:shadow-[0_12px_36px_rgb(255,139,80,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                Explore Packages
              </a>
              <button
                type="button"
                onClick={() => openFormModal()}
                className="px-8 py-4 rounded-full text-sm font-bold text-white border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
              >
                Plan My Trip
              </button>
            </div>
          </div>

          {/* Quick Info Panel */}
          <div
            className="lg:col-span-5 animate-scale-in"
            style={{ animationDelay: "750ms", animationFillMode: "both" }}
          >
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-xl space-y-6 text-left glow-orange relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-secondary/15 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-xl font-bold text-white tracking-tight border-b border-white/15 pb-4 relative z-10">
                A Journey Beyond Expectations
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm hover:bg-white/15 p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:translate-x-1 transition-all duration-300 ease-in-out group">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/25 flex items-center justify-center text-brand-primary font-black group-hover:scale-110 transition-all duration-300 ease-in-out">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Bespoke Itineraries</h4>
                    <p className="text-xs text-white/60">100% personalized travel plans.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm hover:bg-white/15 p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:translate-x-1 transition-all duration-300 ease-in-out group">
                  <div className="w-10 h-10 rounded-2xl bg-brand-secondary/25 flex items-center justify-center text-brand-secondary font-black group-hover:scale-110 transition-all duration-300 ease-in-out">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">All-inclusive Comfort</h4>
                    <p className="text-xs text-white/60">Hotels, transport & guides included.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm hover:bg-white/15 p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:translate-x-1 transition-all duration-300 ease-in-out group">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/25 flex items-center justify-center text-brand-primary font-black group-hover:scale-110 transition-all duration-300 ease-in-out">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Trusted Experts</h4>
                    <p className="text-xs text-white/60">Award-winning local operators.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
