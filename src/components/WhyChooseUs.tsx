"use client";

import { MapPin, Building2, Car, Compass, PlaneLanding, Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTenant } from "@/context/TenantBrandingContext";

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
  const tenant = useTenant();
  const brandName = tenant.name || "Ceylon Travel";

  return (
    <section id="why-choose-us" className="bg-amber-400 px-6 py-12 md:py-16 scroll-mt-16">
      <div className="max-w-6xl mx-auto">
        <p data-aos="fade-right" className="text-white font-bold text-xs tracking-wider uppercase mb-1">Curated Escapes</p>
        <h2 data-aos="fade-right" data-aos-delay="100" className="text-slate-900 text-2xl sm:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
          Why Travelers Choose {brandName}
        </h2>
        <p data-aos="fade-right" data-aos-delay="200" className="text-slate-800/90 max-w-xl mb-6 text-xs sm:text-sm leading-relaxed">
          Handpicked premium tours that combine comfort, adventure, and immersive local
          experiences. Explore Sri Lanka with our carefully crafted travel packages.
        </p>
        <button
          onClick={() => router.push(`/${locale}/customize-tour`)}
          data-aos="fade-right" data-aos-delay="300"
          className="rounded-full bg-slate-900 text-white text-xs font-bold px-5 py-2.5 mb-10 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
        >
          Plan Your Escape
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_CHOOSE.map(({ icon: Icon, title, body }, i) => (
            <div key={title} data-aos="zoom-in" data-aos-delay={i * 80} className="rounded-xl bg-slate-900 p-5 flex flex-col gap-3 shadow-md">
              <span className="h-9 w-9 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="text-white font-bold uppercase text-xs tracking-wide mb-1.5">
                  {title}
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">{body}</p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/customize-tour`)}
                className="mt-1 w-fit rounded-full bg-amber-400 text-slate-900 text-[11px] font-bold px-3.5 py-1.5 hover:bg-amber-300 transition-colors"
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
