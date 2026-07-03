"use client";

import { useTravelRequest } from "@/context/TravelRequestContext";

export default function Contact() {
  const { openFormModal } = useTravelRequest();
  return (
    <section id="contact" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-center text-left">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Inquiries
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
                Plan Your Journey
              </h2>
              <p className="text-base text-slate-500 leading-relaxed">
                Ready to explore? Drop us a line. Our dedicated travel planners will respond to you within 24 hours to schedule a custom consultation.
              </p>
            </div>

            {/* Quick Contact Links */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700">hello@horizontravel.com</span>
              </div>
            </div>
          </div>

          {/* CTA Card Side */}
          <div className="lg:col-span-7 flex items-center">
            <div className="w-full bg-brand-dark text-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden border border-white/5 shadow-2xl text-left">
              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/15 rounded-full blur-3xl -z-10" />
              
              <div className="space-y-6 relative z-10">
                <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-primary border border-white/5">
                  Start Your Consultation
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Design Your Dream Sri Lankan Getaway
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Use our step-by-step customization wizard to design a personalized itinerary. Choose destinations, select activities, and lock in pricing details with our local travel specialists.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <span className="text-brand-primary font-black">✓</span> Curated local guides and private transport options.
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <span className="text-brand-primary font-black">✓</span> Flexible planning and free cancellations.
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <span className="text-brand-primary font-black">✓</span> Personal specialist coordinates every booking detail.
                  </div>
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => openFormModal()}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark text-sm font-extrabold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  >
                    Start Planning Now &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
