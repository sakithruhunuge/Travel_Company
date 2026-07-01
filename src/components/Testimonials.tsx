"use client";

import Image from "next/image";

const guestReviews = [
  {
    name: "Charlotte Mercier",
    country: "France",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
    review: "The Hill Country Adventure was spectacular! The scenic train journey to Ella is something we will cherish forever. Highly recommend Horizon Travel for their flawless planning.",
    rating: 5,
    package: "Hill Country Adventure",
  },
  {
    name: "Liam Kaelen",
    country: "Germany",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    review: "The Cultural Triangle Explorer exceeded all expectations. Sigiriya Rock Fortress is mind-blowing. Our private vehicle was clean, and the English-speaking guide made history come alive.",
    rating: 5,
    package: "Cultural Triangle Explorer",
  },
  {
    name: "Sarah Lawson",
    country: "Australia",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    review: "We booked the Southern Beach Escape. Golden beaches, whale watching in Mirissa, and the historic Galle Fort were incredible. Smooth airport pickup and excellent beach resort selections.",
    rating: 5,
    package: "Southern Beach Escape",
  },
  {
    name: "David Ross",
    country: "United Kingdom",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    review: "The Wildlife Safari Experience was absolute magic! We saw leopards, sloth bears, and herds of wild elephants in Yala. Highly professional drivers and beautiful national park resorts.",
    rating: 5,
    package: "Wildlife Safari Experience",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Guest Testimonials
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            Loved by Travelers Worldwide
          </h2>
          <p className="text-base text-slate-500">
            Read stories from international tourists who explored the rich culture, scenic highlands, and gold coastlines of Sri Lanka with us.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {guestReviews.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between h-full hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-6">
                {/* Rating */}
                <div className="flex gap-1">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-brand-accent fill-brand-accent"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic text-left">
                  &ldquo;{item.review}&rdquo;
                </p>
              </div>

              {/* Guest Profile */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-200/50">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 leading-tight">{item.name}</span>
                  <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {item.country} &bull; {item.package}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
