"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

import PageTransition from "./ui/PageTransition";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeaderFooter = pathname !== "/login" && pathname !== "/signup" && !pathname.startsWith("/dashboard");

  return (
    <>
      {showHeaderFooter && <Navbar />}
      <PageTransition>{children}</PageTransition>
      {showHeaderFooter && <Footer />}
    </>
  );
}
