import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import LayoutWrapper from "@/components/LayoutWrapper";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenantResolver";
import { TenantBrandingProvider } from "@/context/TenantBrandingContext";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const hostname = headers().get("host") || "";
  try {
    const tenant = await resolveTenant({ hostname });
    const tagline = tenant.branding?.tagline || "Explore Your Next Adventure";
    return {
      title: `${tenant.name} - ${tagline}`,
      description: tenant.branding?.tagline || "Discover curated travel packages, premium tours, and unforgettable destinations.",
    };
  } catch (error) {
    return {
      title: "Horizon Travel - Explore Your Next Adventure",
      description: "Discover curated travel packages, premium tours, and unforgettable destinations.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hostname = headers().get("host") || "";
  let tenant = null;

  try {
    tenant = await resolveTenant({ hostname });
  } catch (error) {
    console.error("RootLayout tenant resolution error:", error);
    tenant = {
      id: null,
      slug: "default-tenant",
      name: "Horizon Travel",
      status: "active" as const,
      isolation: "shared" as const,
      plan: "free" as const,
      branding: {
        primaryColor: "#FF8B50",
        secondaryColor: "#25A5FE",
        tagline: "Explore Your Next Adventure",
      },
    };
  }

  const primaryColor = tenant.branding?.primaryColor || "#FF8B50";
  const secondaryColor = tenant.branding?.secondaryColor || "#25A5FE";

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand-primary: ${primaryColor};
                --brand-secondary: ${secondaryColor};
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-brand-light text-brand-dark antialiased min-h-screen flex flex-col`}>
        <AntdRegistry>
          <TenantBrandingProvider tenant={tenant}>
            <Providers>
              <LayoutWrapper>{children}</LayoutWrapper>
            </Providers>
          </TenantBrandingProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
