"use client";

import Link from "next/link";
import { useTenant } from "@/context/TenantBrandingContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const tenant = useTenant();

  return (
    <footer className="bg-brand-dark text-brand-muted py-16 border-t border-white/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Dynamic Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-block transition-all duration-300 ease-in-out hover:opacity-80">
              {tenant.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.branding.logoUrl}
                  alt={tenant.name}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-2xl font-black tracking-tight text-white uppercase">
                  {tenant.name}
                </span>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-brand-muted">
              {tenant.branding?.tagline ||
                "Crafting premium travel experiences and lifelong memories. Explore the world's most breathtaking destinations with our dedicated team of travel experts."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-sm hover:text-brand-primary transition-all duration-300 ease-in-out">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-sm hover:text-brand-primary transition-all duration-300 ease-in-out">
                  About
                </a>
              </li>
              <li>
                <a href="#packages" className="text-sm hover:text-brand-primary transition-all duration-300 ease-in-out">
                  Packages
                </a>
              </li>
              <li>
                <a href="#why-choose-us" className="text-sm hover:text-brand-primary transition-all duration-300 ease-in-out">
                  Why Choose Us
                </a>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Business Hours</h3>
            <ul className="space-y-3 text-sm">
              <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>

          {/* Contacts info */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li>Colombo, Sri Lanka</li>
              <li>Email: contact@{tenant.slug}.travelcompany.com</li>
              <li>Phone: +94 11 234 5678</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {currentYear} {tenant.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-all">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-all">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
