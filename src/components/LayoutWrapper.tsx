"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

import PageTransition from "./ui/PageTransition";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const showHeaderFooter = pathWithoutLocale !== "/login" && pathWithoutLocale !== "/signup" && !pathWithoutLocale.startsWith("/dashboard");

  return (
    <>
      {showHeaderFooter && <Navbar />}
      <PageTransition>{children}</PageTransition>
      {showHeaderFooter && <Footer />}
    </>
  );
}
