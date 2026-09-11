"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { useTenant } from "@/context/TenantBrandingContext";
import PageTransition from "./ui/PageTransition";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const showHeaderFooter = !["/login", "/signup", "/forgot-password"].includes(pathWithoutLocale) && !pathWithoutLocale.startsWith("/dashboard");

  return (
    <>
      {showHeaderFooter && <Navbar />}
      <PageTransition>{children}</PageTransition>
      {showHeaderFooter && <Footer />}
    </>
  );
}
