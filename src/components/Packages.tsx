"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTravelRequest } from "@/context/TravelRequestContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useTranslations } from "next-intl";

export interface TravelPackage {
  id: string;
  name: string;
  duration: string;
  destinations: string[];
  includes: string[];
  image: string;
  priceRange: string;
  rating: string;
}

export default function Packages() {
  const { openFormModal } = useTravelRequest();
  const { formatPriceString } = useCurrency();
  const t = useTranslations("Packages");

  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Primary API endpoint: FastAPI Backend Gateway
      const res = await fetch("http://localhost:8000/api/v1/packages");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      const rawList = data.packages || data || [];
      const normalized: TravelPackage[] = rawList.map((doc: any, idx: number) => ({
        id: doc.package_id || doc._id || doc.id || `pkg_${idx}`,
        name: doc.title || doc.name || "Curated Travel Package",
        duration: doc.duration_days 
          ? `${doc.duration_days} Days / ${doc.duration_days - 1} Nights`
          : doc.duration || "4 Days / 3 Nights",
        destinations: Array.isArray(doc.destinations) 
          ? doc.destinations 
          : [doc.destination || "Sri Lanka"],
        includes: Array.isArray(doc.includes) && doc.includes.length > 0
          ? doc.includes
          : ["Luxury Accommodation", "Private Transport & Driver", "Breakfast & Dining", "Guided Sightseeing"],
        image: doc.image_url || doc.image || "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80",
        priceRange: doc.price_usd ? `$${doc.price_usd} USD` : doc.priceRange || "$450 USD",
        rating: doc.rating ? String(doc.rating) : "4.9"
      }));

      setPackages(normalized);
    } catch (err: any) {
      console.warn("FastAPI backend fetch failed; trying fallback /api/packages endpoint...", err);
      try {
        // Fallback to local Next.js route
        const fallbackRes = await fetch("/api/packages");
        if (!fallbackRes.ok) throw new Error("Fallback fetch failed");
        const fallbackData = await fallbackRes.json();
        if (fallbackData.packages && fallbackData.packages.length > 0) {
          setPackages(fallbackData.packages);
        } else {
          setError("Failed to load travel packages. Please check your connection and try again.");
        }
      } catch (fallbackErr) {
        setError("Unable to connect to travel package server. Please refresh or try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <section id="packages" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-fade-in-up">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            {t("tagline")}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            {t("title")}
          </h2>
          <p className="text-base text-brand-muted">
            {t("description")}
          </p>
        </div>

        {/* Loaders, Errors, and Package Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-slate-50 border border-slate-100 rounded-3xl h-[480px] p-6 flex flex-col justify-between animate-pulse"
              >
                <div className="bg-slate-200 h-52 rounded-2xl w-full mb-4" />
                <div className="space-y-3">
                  <div className="bg-slate-200 h-6 w-3/4 rounded-md" />
                  <div className="bg-slate-200 h-4 w-1/2 rounded-md" />
                  <div className="bg-slate-200 h-4 w-full rounded-md" />
                </div>
                <div className="bg-slate-200 h-12 rounded-full w-full mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-amber-900">Service Temporarily Unavailable</h3>
            <p className="text-sm text-amber-700">{error}</p>
            <button
              type="button"
              onClick={fetchPackages}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full text-sm transition-all cursor-pointer shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 font-semibold">No packages available at this time. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/60 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out flex flex-col h-full animate-fade-in-up"
                style={{ animationDelay: `${100 + idx * 100}ms`, animationFillMode: "both" }}
              >
                {/* Image Container */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={pkg.image}
                    alt={pkg.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-all duration-300 ease-in-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-lg px-3 py-1 rounded-full text-xs font-bold text-brand-dark flex items-center gap-1 shadow-xl z-10">
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
                      <h3 className="text-lg font-black text-brand-dark group-hover:text-brand-secondary transition-all duration-300 ease-in-out leading-tight">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2.5 text-brand-muted">
                        <svg className="w-4 h-4 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-brand-muted">{pkg.duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">{t("from")}</span>
                      <span className="text-lg font-black text-brand-secondary whitespace-nowrap">
                        {formatPriceString(pkg.priceRange)}
                      </span>
                    </div>
                  </div>

                  {/* Destinations */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">{t("destinations")}</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {pkg.destinations.map((dest, i) => (
                        <span key={i} className="inline-flex bg-brand-light text-brand-dark text-[11px] px-2.5 py-1 rounded-full font-semibold border border-brand-light">
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions */}
                  <div className="space-y-2 flex-grow">
                    <span className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">{t("includes")}</span>
                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                      {pkg.includes.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-brand-muted font-semibold">
                          <svg className="w-3.5 h-3.5 text-brand-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M16.7 5.3a1 1 0 010 1.4l-7.3 7.3a1 1 0 01-1.4 0l-3.3-3.3a1 1 0 011.4-1.4l2.6 2.6 6.6-6.6a1 1 0 011.4 0z" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-light">
                    <button
                      type="button"
                      onClick={() => openFormModal(pkg.id)}
                      className="block w-full text-center py-3 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary rounded-full font-bold shadow-[0_4px_20px_rgba(var(--brand-primary),0.15)] hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
                    >
                      {t("select")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
