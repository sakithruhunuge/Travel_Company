"use client";

function Facebook({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Twitter({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function Instagram({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-center w-full overflow-hidden pt-20">
      {/* Desktop Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sri2.png"
        alt="Sri Lanka Desktop"
        className="hidden md:block absolute inset-0 h-full w-full object-cover"
      />

      {/* Mobile Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sri3.png"
        alt="Sri Lanka Mobile"
        className="block md:hidden absolute inset-0 h-full w-full object-cover"
      />

      {/* Social Links Overlay */}
      <div className="absolute bottom-8 right-6 md:bottom-12 md:right-12 flex items-center gap-6 text-white z-10">
        <a
          href="#"
          aria-label="Twitter"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-110 transition-all duration-300"
        >
          <Twitter size={24} />
        </a>
        <a
          href="#"
          aria-label="Facebook"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-110 transition-all duration-300"
        >
          <Facebook size={24} />
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-110 transition-all duration-300"
        >
          <Instagram size={24} />
        </a>
      </div>
    </section>
  );
}