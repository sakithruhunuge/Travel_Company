"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeaderFooter = pathname !== "/login" && pathname !== "/signup" && !pathname.startsWith("/dashboard");

  return (
    <>
      {showHeaderFooter && <Navbar />}
      <main className="flex-grow">{children}</main>
      {showHeaderFooter && <Footer />}
    </>
  );
}
