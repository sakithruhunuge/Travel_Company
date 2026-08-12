"use client";

import { MapPin, Building2, Car, Compass, PlaneLanding, Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const WHY_CHOOSE = [
  { icon: MapPin, title: "Trusted Local Travel Experts", body: "Our team knows Sri Lanka inside out, from hidden gems to hotspots." },
  { icon: Building2, title: "Handpicked Hotels", body: "We personally vet every hotel and homestay for comfort and quality." },
  { icon: Car, title: "Comfortable Transportation", body: "Travel across the island in modern, air-conditioned private vehicles." },
  { icon: Compass, title: "Personalized Itineraries", body: "Every trip is tailored around your pace, interests, and preferences." },
  { icon: PlaneLanding, title: "Airport Pickup & Assistance", body: "We greet you on arrival and handle every travel detail for you." },
  { icon: Headphones, title: "24/7 Customer Support", body: "Our local specialists are on call around the clock during your trip." },
];

export default function WhyChooseUs() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <section id="why-choose-us" className="bg-amber-400 px-6 py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <p data-aos="fade-right" className="text-white font-bold tracking-wide uppercase mb-2">Curated Escapes</p>
        <h2 data-aos="fade-right" data-aos-delay="100" className="text-slate-900 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
          Why Travelers <br className="hidden md:block" /> Choose Horizon Travel
        </h2>
        <p data-aos="fade-right" data-aos-delay="200" className="text-slate-800/80 max-w-2xl mb-8 text-lg">
          Handpicked premium tours that combine comfort, adventure, and immersive local
          experiences. Explore Sri Lanka with our carefully crafted travel packages.
        </p>
        <button
          onClick={() => router.push(`/${locale}/customize-tour`)}
          data-aos="fade-right" data-aos-delay="300"
          className="rounded-full bg-slate-900 text-white text-sm font-semibold px-6 py-3 mb-14 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
        >
          Plan Your Escape
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CHOOSE.map(({ icon: Icon, title, body }, i) => (
            <div key={title} data-aos="zoom-in" data-aos-delay={i * 80} className="rounded-2xl bg-slate-900 p-6 flex flex-col gap-4 shadow-lg">
              <span className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="text-white font-bold uppercase text-sm tracking-wide mb-2">
                  {title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">{body}</p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/customize-tour`)}
                className="mt-2 w-fit rounded-full bg-amber-400 text-slate-900 text-xs font-semibold px-4 py-2 hover:bg-amber-300 transition-colors"
              >
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
