"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useTenant } from "@/context/TenantBrandingContext";

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState(0);
  const tenant = useTenant();
  const brandName = tenant.name || "Ceylon Travel";

  const testimonials = [
    {
      name: "Charlotte Mercier",
      quote:
        `This country adventure was spectacular. The train journey to Ella is something we will never forget, highly recommend ${brandName} for their flawless planning.`,
    },
    {
      name: "David & Sarah Jenkins",
      quote:
        "From safari in Yala to the historic streets of Galle, every detail was perfectly arranged. Truly a 5-star experience in Sri Lanka!",
    },
    {
      name: "Elena Rostova",
      quote:
        "Exploring Sigiriya and Nuwara Eliya with our local guide made us feel completely safe and pampered. Will definitely come back!",
    },
  ];

  const prevTestimonial = () => {
    setActiveTab((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    setActiveTab((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-white px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <p data-aos="fade-up" className="text-amber-500 font-bold text-xs tracking-wider uppercase mb-1">Guest Testimonials</p>
        <h2 data-aos="fade-up" data-aos-delay="100" className="text-slate-900 text-2xl sm:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
          Loved by Travelers Worldwide
        </h2>
        <p data-aos="fade-up" data-aos-delay="200" className="text-slate-500 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
          Read stories from international tourists who explored the rich culture, scenic
          highlands, and gold coastlines of Sri Lanka with us.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t, idx) => (
          <div key={idx} data-aos="fade-up" data-aos-delay={idx * 120} className="rounded-xl bg-slate-900 p-5 flex flex-col gap-3 shadow-md">
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            <p className="text-white font-semibold text-xs mt-auto pt-3 border-t border-white/10">{t.name}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-8">
        <button
          onClick={prevTestimonial}
          className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex gap-1.5">
          {testimonials.map((_, i) => (
            <span
              key={i}
              onClick={() => setActiveTab(i)}
              className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                activeTab === i ? "w-5 bg-amber-400" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextTestimonial}
          className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}
