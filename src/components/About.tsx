"use client";

import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Visual Showcase (Left) */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden h-64 shadow-md hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=600&q=80"
                    alt="Sigiriya Rock Fortress"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                </div>
                <div className="relative rounded-3xl overflow-hidden h-48 shadow-md hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
                    alt="Golden Coast Beaches"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative rounded-3xl overflow-hidden h-48 shadow-md hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=600&q=80"
                    alt="Ella Train Journey"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                </div>
                <div className="relative rounded-3xl overflow-hidden h-64 shadow-md hover:scale-[1.02] transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=600&q=80"
                    alt="Elephant Safari Wildlife"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                </div>
              </div>
            </div>
            {/* Ambient background decoration */}
            <div className="absolute -z-10 -top-4 -left-4 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl" />
            <div className="absolute -z-10 -bottom-4 -right-4 w-32 h-32 bg-brand-secondary/15 rounded-full blur-xl" />
          </div>

          {/* Text Content (Right) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Wonder of Asia
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight leading-tight">
              Why Visit Sri Lanka?
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Sri Lanka is an island paradise packing diverse, breathtaking travel experiences into a compact destination. Known as the &quot;Pearl of the Indian Ocean,&quot; it caters to every type of global traveler.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex-shrink-0 flex items-center justify-center font-bold text-sky-600">1</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Ancient World Heritage</h4>
                  <p className="text-xs text-slate-500 mt-1">Explore over 2,500 years of civilization, featuring 8 UNESCO World Heritage Sites including Sigiriya and Kandy.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex-shrink-0 flex items-center justify-center font-bold text-teal-600">2</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Scenic Misty mountains</h4>
                  <p className="text-xs text-slate-500 mt-1">Ride the world-famous blue train through cascading tea estates, green hills, and waterfalls in Ella and Nuwara Eliya.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex-shrink-0 flex items-center justify-center font-bold text-amber-600">3</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Rich Wildlife Safaris</h4>
                  <p className="text-xs text-slate-500 mt-1">Embark on open jeep safaris in Yala or Udawalawe to see high leopard densities, sloth bears, and giant elephant herds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
