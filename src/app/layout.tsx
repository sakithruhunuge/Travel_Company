import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import LayoutWrapper from "@/components/LayoutWrapper";

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
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
