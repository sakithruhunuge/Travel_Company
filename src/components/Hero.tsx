"use client";

import Image from "next/image";
import { sriLankaImages } from "@/constants/sriLankaImages";
import { useTravelRequest } from "@/context/TravelRequestContext";

export default function Hero() {
  const { openFormModal } = useTravelRequest();
  return (
    <section id="home" className="relative bg-slate-950 py-32 overflow-hidden flex items-center min-h-[90vh]">
      {/* Background Image using Next.js Image component */}
      <div className="absolute inset-0 z-0">
        <Image
          src={sriLankaImages.hero.imageUrl}
          alt={sriLankaImages.hero.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Dark overlays to maintain text readability */}
        <div className="absolute inset-0 bg-slate-950/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 z-10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <span 
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/25 animate-fade-in-up"
              style={{ animationDelay: "150ms", animationFillMode: "both" }}
            >
              Explore the Pearl of the Indian Ocean
            </span>
            <h1 
              className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15] animate-fade-in-up"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              Discover the Beauty <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary">
                of Sri Lanka
              </span>
            </h1>
            <p 
              className="text-lg text-slate-300 leading-relaxed max-w-xl animate-fade-in-up"
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
                className="px-8 py-4 rounded-full text-sm font-bold text-brand-dark bg-brand-primary hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/30 hover:scale-[1.02] transition-all duration-300"
              >
                Explore Packages
              </a>
              <button
                type="button"
                onClick={() => openFormModal()}
                className="px-8 py-4 rounded-full text-sm font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
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
            <div className="glass-dark p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 text-left glow-gold animate-float relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-xl font-bold text-white tracking-tight border-b border-white/10 pb-4">
                A Journey Beyond Expectations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:translate-x-1 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black group-hover:scale-110 transition-transform">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Bespoke Itineraries</h4>
                    <p className="text-xs text-slate-400">100% personalized travel plans.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:translate-x-1 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent font-black group-hover:scale-110 transition-transform">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">All-inclusive Comfort</h4>
                    <p className="text-xs text-slate-400">Hotels, transport & guides included.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:translate-x-1 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-black group-hover:scale-110 transition-transform">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Trusted Experts</h4>
                    <p className="text-xs text-slate-400">Award-winning local operators.</p>
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
