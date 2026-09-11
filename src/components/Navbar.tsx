"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency, Currency } from "@/context/CurrencyContext";
import { useTenant } from "@/context/TenantBrandingContext";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const tenant = useTenant();

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const { currency, setCurrency } = useCurrency();

  const handleLanguageChange = (nextLocale: string) => {
    let newPath = pathname;
    if (pathname.startsWith(`/${locale}/`)) {
      newPath = pathname.replace(`/${locale}/`, `/${nextLocale}/`);
    } else if (pathname === `/${locale}`) {
      newPath = `/${nextLocale}`;
    } else {
      newPath = `/${nextLocale}${pathname}`;
    }
    router.replace(newPath);
  };

  const brandName = tenant.name || "Ceylon Travel";

  const navLinks = [
    { label: t("home"), href: `/${locale}/#home` },
    { label: t("about"), href: `/${locale}/#about` },
    { label: t("destinations"), href: `/${locale}/#destinations` },
    { label: t("packages"), href: `/${locale}/#packages` },
    { label: t("customize"), href: `/${locale}/customize-tour` },
    { label: t("whyChooseUs"), href: `/${locale}/#why-choose-us` },
    { label: t("contact"), href: `/${locale}/#contact` },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full py-3.5 px-4 sm:px-8 bg-white/45 backdrop-blur-lg border-b border-white/30 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 w-full">

        {/* Brand Logo / Name */}
        <div className="flex items-center shrink-0">
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            {tenant.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.branding.logoUrl} alt={brandName} className="h-8 sm:h-9 w-auto object-contain" />
            ) : (
              <span className="text-base sm:text-lg font-black tracking-wider text-slate-900 group-hover:text-amber-500 transition-colors uppercase drop-shadow-sm">
                {brandName}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop Centralized Nav Links */}
        <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-7 font-bold text-slate-900 text-xs xl:text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-amber-500 transition-colors py-1 relative group/link whitespace-nowrap drop-shadow-sm"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-500 transition-all duration-300 group-hover/link:w-full rounded-full" />
            </Link>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Language Selector */}
          <div className="relative inline-flex items-center">
            <select
              aria-label="Language Selector"
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-slate-900 text-white text-[11px] font-bold py-1.5 pl-3.5 pr-7 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer outline-none shadow-md border border-slate-700 text-center leading-none"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
              <option value="de" className="bg-slate-900 text-white">DE</option>
              <option value="si" className="bg-slate-900 text-white">SI</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
          </div>

          {/* Currency Selector */}
          <div className="relative inline-flex items-center">
            <select
              aria-label="Currency Selector"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="appearance-none bg-slate-900 text-white text-[11px] font-bold py-1.5 pl-3.5 pr-7 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer outline-none shadow-md border border-slate-700 text-center leading-none"
            >
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
              <option value="LKR" className="bg-slate-900 text-white">LKR (Rs)</option>
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
          </div>

          {session ? (
            <ProfileDropdown />
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold transition-all duration-300 hover:bg-slate-800 hover:scale-105 shadow-md border border-slate-700"
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-slate-900 p-1.5 rounded-lg hover:bg-white/30 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden mt-3 bg-white/95 rounded-2xl p-5 flex flex-col gap-3 text-slate-900 shadow-2xl backdrop-blur-md border border-black/10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold hover:text-amber-500 transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex flex-wrap items-center gap-2.5 mt-2 pt-3 border-t border-slate-200">
            <div className="relative flex-1">
              <select
                aria-label="Mobile Language Selector"
                value={locale}
                onChange={(e) => {
                  handleLanguageChange(e.target.value);
                  setMenuOpen(false);
                }}
                className="appearance-none w-full bg-slate-900 text-white rounded-full pl-4 pr-8 py-2 text-xs font-bold outline-none text-center leading-none"
              >
                <option value="en">English (EN)</option>
                <option value="fr">French (FR)</option>
                <option value="de">German (DE)</option>
                <option value="si">Sinhala (SI)</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <select
                aria-label="Mobile Currency Selector"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="appearance-none w-full bg-slate-900 text-white rounded-full pl-4 pr-8 py-2 text-xs font-bold outline-none text-center leading-none"
              >
                <option value="USD">USD ($)</option>
                <option value="LKR">LKR (Rs)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
            </div>
          </div>

          <div className="mt-2">
            {session ? (
              <ProfileDropdown />
            ) : (
              <Link
                href={`/${locale}/login`}
                onClick={() => setMenuOpen(false)}
                className="block text-center px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold w-full shadow-sm"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
