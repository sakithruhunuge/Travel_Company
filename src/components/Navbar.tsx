"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/ProfileDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency, Currency } from "@/context/CurrencyContext";
import { useTenant } from "@/context/TenantBrandingContext";
import { Menu, X } from "lucide-react";

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full py-4 px-6 lg:px-12 bg-white/10 backdrop-blur-md border-b border-white/20 transition-all duration-300">
      <div className="w-full mx-auto flex lg:grid lg:grid-cols-[1fr_auto_1fr] items-center justify-between">

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center">
          <Link href={`/${locale}`}>
            {tenant.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/horizon logo white.png" alt="Horizon Travel" className="h-8 w-auto object-contain" />
            )}
          </Link>
        </div>

        {/* Desktop Left Nav */}
        <nav className="hidden lg:flex items-center justify-end pr-8 gap-8 font-semibold text-slate-900 text-base">
          <Link href={`/${locale}/#home`} className="hover:text-amber-500 transition-colors">{t("home")}</Link>
          <Link href={`/${locale}/#about`} className="hover:text-amber-500 transition-colors">{t("about")}</Link>
          <Link href={`/${locale}/#destinations`} className="hover:text-amber-500 transition-colors">{t("destinations")}</Link>
          <Link href={`/${locale}/#packages`} className="hover:text-amber-500 transition-colors">{t("packages")}</Link>
        </nav>

        {/* Desktop Center Logo */}
        <div className="hidden lg:flex justify-center">
          <Link href={`/${locale}`}>
            {tenant.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-10 w-auto object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/horizon logo white.png" alt="Horizon Travel Logo" className="h-10 w-auto object-contain" />
            )}
          </Link>
        </div>

        {/* Desktop Right Nav & Buttons */}
        <div className="hidden lg:flex items-center justify-start pl-8 gap-6">
          <nav className="flex items-center gap-8 font-semibold text-slate-900 text-base">
            <Link href={`/${locale}/customize-tour`} className="hover:text-amber-500 transition-colors">{t("customize")}</Link>
            <Link href={`/${locale}/#why-choose-us`} className="hover:text-amber-500 transition-colors">{t("whyChooseUs")}</Link>
            <Link href={`/${locale}/#contact`} className="hover:text-amber-500 transition-colors">{t("contact")}</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer outline-none"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
              <option value="de" className="bg-slate-900 text-white">DE</option>
              <option value="si" className="bg-slate-900 text-white">SI</option>
            </select>

            {/* Currency Selector */}
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer outline-none"
            >
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
              <option value="LKR" className="bg-slate-900 text-white">LKR (Rs)</option>
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
            </select>

            {session ? (
              <ProfileDropdown />
            ) : (
              <Link
                href={`/${locale}/login`}
                className="px-6 py-2 rounded-full bg-slate-900 text-white text-sm font-bold transition-all duration-300 hover:scale-105"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-slate-900 p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="lg:hidden mt-4 bg-white/95 rounded-2xl p-6 flex flex-col gap-4 text-slate-900 shadow-xl backdrop-blur-md border border-black/10">
          <Link href={`/${locale}/#home`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("home")}</Link>
          <Link href={`/${locale}/#about`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("about")}</Link>
          <Link href={`/${locale}/#destinations`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("destinations")}</Link>
          <Link href={`/${locale}/#packages`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("packages")}</Link>
          <Link href={`/${locale}/customize-tour`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("customize")}</Link>
          <Link href={`/${locale}/#why-choose-us`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("whyChooseUs")}</Link>
          <Link href={`/${locale}/#contact`} onClick={() => setMenuOpen(false)} className="font-bold hover:text-amber-500 transition-colors">{t("contact")}</Link>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-3 border-t border-slate-200">
            <select
              aria-label="Mobile Language Selector"
              value={locale}
              onChange={(e) => {
                handleLanguageChange(e.target.value);
                setMenuOpen(false);
              }}
              className="flex-1 bg-slate-900 text-white rounded-full px-4 py-2 text-sm font-bold"
            >
              <option value="en">English (EN)</option>
              <option value="fr">French (FR)</option>
              <option value="de">German (DE)</option>
              <option value="si">Sinhala (SI)</option>
            </select>
            <select
              aria-label="Mobile Currency Selector"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="flex-1 bg-slate-900 text-white rounded-full px-4 py-2 text-sm font-bold"
            >
              <option value="USD">USD ($)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="mt-2">
            {session ? (
              <ProfileDropdown />
            ) : (
              <Link
                href={`/${locale}/login`}
                onClick={() => setMenuOpen(false)}
                className="block text-center px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold w-full"
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
