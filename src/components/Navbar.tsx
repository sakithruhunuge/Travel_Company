"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Destinations", href: "/#destinations" },
  { label: "Packages", href: "/#packages" },
  { label: "Why Choose Us", href: "/#why-choose-us" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 transition-all duration-300 ease-in-out shadow-sm shadow-black/[0.03]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group transition-all duration-300 ease-in-out">
              <span className="text-2xl font-black tracking-wider text-brand-dark group-hover:text-brand-primary transition-all duration-300 ease-in-out">
                HORIZON<span className="text-brand-primary group-hover:text-brand-secondary transition-all duration-300 ease-in-out font-medium">TRAVEL</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-bold text-brand-muted hover:text-brand-secondary transition-all duration-300 ease-in-out relative py-1 group/item"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-primary transition-all duration-300 ease-in-out group-hover/item:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA / Auth */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <ProfileDropdown />
            ) : (
              <Link
                href={`/login`}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold text-white bg-brand-secondary hover:bg-brand-secondary/90 shadow-[0_8px_30px_rgb(37,165,254,0.3)] hover:shadow-[0_12px_36px_rgb(37,165,254,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2.5 rounded-2xl text-brand-muted hover:text-brand-dark hover:bg-white/60 focus:outline-none transition-all duration-300 ease-in-out"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden animate-fade-in-down" id="mobile-menu">
          <div className="px-3 pt-2 pb-5 space-y-1 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-xl">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-2xl text-base font-bold text-brand-muted hover:bg-white/60 hover:text-brand-secondary transition-all duration-300 ease-in-out"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 pb-2 px-4 border-t border-white/30 mt-2">
              {session ? (
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <ProfileDropdown />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 rounded-full text-base font-bold text-white bg-brand-secondary hover:bg-brand-secondary/90 shadow-[0_8px_30px_rgb(37,165,254,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
