"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Charlotte Mercier",
    quote:
      "This country adventure was spectacular. The train journey to Ella is something we will never forget, highly recommend Horizon Travel for their flawless planning.",
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

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState(0);

  const prevTestimonial = () => {
    setActiveTab((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    setActiveTab((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-white px-6 py-24">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <p data-aos="fade-up" className="text-amber-500 font-bold tracking-wide uppercase mb-2">Guest Testimonials</p>
        <h2 data-aos="fade-up" data-aos-delay="100" className="text-slate-900 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
          Loved by Travelers <br className="hidden md:block" />  Worldwide
        </h2>
        <p data-aos="fade-up" data-aos-delay="200" className="text-slate-500 max-w-xl mx-auto mt-4 text-lg">
          Read stories from international tourists who explored the rich culture, scenic
          highlands, and gold coastlines of Sri Lanka with us.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div key={idx} data-aos="fade-up" data-aos-delay={idx * 120} className="rounded-2xl bg-slate-900 p-6 flex flex-col gap-4 shadow-lg">
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-white/80 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            <p className="text-white font-semibold text-sm mt-auto pt-4 border-t border-white/10">{t.name}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={prevTestimonial}
          className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <span
              key={i}
              onClick={() => setActiveTab(i)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                activeTab === i ? "w-6 bg-amber-400" : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextTestimonial}
          className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
