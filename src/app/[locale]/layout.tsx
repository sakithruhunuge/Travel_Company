import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Providers from "../Providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import LayoutWrapper from "@/components/LayoutWrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Horizon Travel - Explore Your Next Adventure",
  description: "Discover curated travel packages, premium tours, and unforgettable destinations with Horizon Travel agency.",
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <body className={`${inter.className} bg-brand-light text-brand-dark antialiased min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <AntdRegistry>
            <Providers>
              <LayoutWrapper>{children}</LayoutWrapper>
            </Providers>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
