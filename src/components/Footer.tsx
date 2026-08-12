"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useTenant } from "@/context/TenantBrandingContext";

export default function Footer() {
  const locale = useLocale();
  const tenant = useTenant();

  return (
    <footer className="bg-slate-950 text-white px-6 py-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div data-aos="fade-up" className="flex flex-col items-center text-center md:items-start md:text-left">
          {tenant.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-10 md:h-12 w-auto mb-4 object-contain mx-auto md:mx-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/horizon log2o white.png" alt="Horizon Travel Logo" className="h-10 md:h-12 w-auto mb-4 object-contain mx-auto md:mx-0" />
          )}
          <p className="text-white/50 text-sm leading-relaxed">
            Crafting travel experiences and unforgettable moments across the pearl of the
            Indian Ocean since our founding.
          </p>
        </div>

        <div data-aos="fade-up" data-aos-delay="100" className="flex flex-col items-center text-center md:items-start md:text-left">
          <h4 className="font-semibold mb-4 text-sm tracking-wide uppercase text-white/80">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-white/50 font-medium">
            <li><Link href={`/${locale}/#home`} className="hover:text-amber-400 transition-colors">Home</Link></li>
            <li><Link href={`/${locale}/#about`} className="hover:text-amber-400 transition-colors">About</Link></li>
            <li><Link href={`/${locale}/#destinations`} className="hover:text-amber-400 transition-colors">Destinations</Link></li>
            <li><Link href={`/${locale}/#packages`} className="hover:text-amber-400 transition-colors">Packages</Link></li>
            <li><Link href={`/${locale}/#why-choose-us`} className="hover:text-amber-400 transition-colors">Why Choose Us</Link></li>
          </ul>
        </div>

        <div data-aos="fade-up" data-aos-delay="200" className="flex flex-col items-center text-center md:items-start md:text-left">
          <h4 className="font-semibold mb-4 text-sm tracking-wide uppercase text-white/80">
            Business Hours
          </h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
            <li>Saturday: 10:00 AM - 4:00 PM</li>
            <li>Sunday: Closed</li>
          </ul>
        </div>

        <div data-aos="fade-up" data-aos-delay="300" className="flex flex-col items-center text-center md:items-start md:text-left">
          <h4 className="font-semibold mb-4 text-sm tracking-wide uppercase text-white/80">
            Contact Us
          </h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li>Address: 123 Ocean Drive, Colombo</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Email: hello@horizontravel.com</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <p>© 2026 Horizon Travel. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
