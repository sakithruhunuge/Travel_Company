"use client";

import { Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function Contact() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <section id="contact" className="bg-amber-400 px-6 py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
        <div data-aos="fade-right" data-aos-duration="900" className="max-w-xl">
          <h2 className="text-slate-900 text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Design Your Dream <br className="hidden md:block" />  Sri Lankan Getaway
          </h2>

          <p className="text-slate-800/90 mb-6 text-lg">
            Use our step-by-step customization wizard to design a personalized itinerary.
            Choose destinations, select activities, and lock in pricing details with our
            local travel specialists.
          </p>
          <ul className="space-y-3 text-base text-slate-900 font-semibold mb-8">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Curated local guides and private transport included
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Flexible planning and free cancellation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Personalized itinerary confirmed within 24 hours
            </li>
          </ul>
          <button
            onClick={() => router.push(`/${locale}/customize-tour`)}
            className="rounded-full bg-slate-900 text-white text-base font-bold px-8 py-4 hover:bg-slate-800 transition-all duration-300 hover:scale-105 shadow-xl"
          >
            Start Planning Now
          </button>
        </div>

        <div data-aos="fade-left" data-aos-delay="200" className="flex flex-col gap-6 text-slate-900 font-bold text-lg">
          <div className="flex items-center gap-4 bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-black/10">
            <span className="h-12 w-12 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Phone size={20} />
            </span>
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-4 bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-black/10">
            <span className="h-12 w-12 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </span>
            <span>hello@horizontravel.com</span>
          </div>
        </div>
      </div>
    </section>
  );
}
