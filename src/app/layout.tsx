import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./Providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Horizon Travel - Explore Your Next Adventure",
  description: "Discover curated travel packages, premium tours, and unforgettable destinations with Horizon Travel agency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-brand-light text-brand-dark antialiased min-h-screen flex flex-col`}>
        <AntdRegistry>
          <Providers>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
