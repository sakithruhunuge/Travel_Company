"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Destinations", href: "#destinations" },
  { label: "Packages", href: "#packages" },
  { label: "Why Choose Us", href: "#why-choose-us" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-brand-dark group-hover:text-brand-primary transition-colors">
                HORIZON<span className="text-brand-primary group-hover:text-brand-accent transition-colors">TRAVEL</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-brand-primary transition-all duration-200 hover:translate-y-[-1px]"
              >
                {link.label}
              </a>
            ))}
            {session && (
              <Link
                href="/my-requests"
                className="text-sm font-semibold text-slate-600 hover:text-brand-primary transition-all duration-200 hover:translate-y-[-1px]"
              >
                My Requests
              </Link>
            )}
          </nav>

          {/* Desktop CTA / Auth */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      fill
                      className="object-cover"
                      sizes="40px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800">{session.user?.name}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-full text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/95 hover:shadow-lg hover:shadow-brand-primary/25 hover:translate-y-[-2px] transition-all duration-200"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 focus:outline-none"
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
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 bg-white border-b border-slate-100 shadow-xl">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            {session && (
              <Link
                href="/my-requests"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-primary transition-colors"
              >
                My Requests
              </Link>
            )}
            <div className="pt-4 pb-2 px-3 border-t border-slate-100 mt-2">
              {session ? (
                <div className="flex items-center gap-3 animate-fade-in">
                  {session.user?.image && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User Avatar"}
                        fill
                        className="object-cover"
                        sizes="40px"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{session.user?.name}</span>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        signOut();
                      }}
                      className="text-sm font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 border border-transparent rounded-full text-base font-bold text-white bg-brand-primary hover:bg-brand-primary/95 transition-colors"
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
