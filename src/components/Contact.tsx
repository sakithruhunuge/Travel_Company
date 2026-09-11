"use client";

import { Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function Contact() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <section id="contact" className="bg-amber-400 px-6 py-12 md:py-16 scroll-mt-16">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div data-aos="fade-right" data-aos-duration="900" className="max-w-lg">
          <h2 className="text-slate-900 text-2xl sm:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
            Design Your Dream <br className="hidden md:block" /> Sri Lankan Getaway
          </h2>

          <p className="text-slate-800/90 mb-4 text-xs sm:text-sm leading-relaxed">
            Use our step-by-step customization wizard to design a personalized itinerary.
            Choose destinations, select activities, and lock in pricing details with our
            local travel specialists.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-900 font-semibold mb-6">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              Curated local guides and private transport included
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              Flexible planning and free cancellation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              Personalized itinerary confirmed within 24 hours
            </li>
          </ul>
          <button
            onClick={() => router.push(`/${locale}/customize-tour`)}
            className="rounded-full bg-slate-900 text-white text-xs font-bold px-6 py-3 hover:bg-slate-800 transition-all duration-300 hover:scale-105 shadow-md"
          >
            Start Planning Now
          </button>
        </div>

        <div data-aos="fade-left" data-aos-delay="200" className="flex flex-col gap-4 text-slate-900 font-bold text-sm">
          <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md p-3.5 rounded-xl border border-black/10">
            <span className="h-10 w-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </span>
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md p-3.5 rounded-xl border border-black/10">
            <span className="h-10 w-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Mail size={16} />
            </span>
            <span>hello@horizontravel.com</span>
          </div>
        </div>
      </div>
    </section>
  );
}
